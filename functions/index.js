/**
 * Firebase Cloud Functions for JobSync
 * Handles incoming emails from CloudMailin and processes them with AI
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');

admin.initializeApp();

// Rate limiting configuration
const RATE_LIMIT_MAX_EMAILS = 100; // Maximum emails per day per forwarder
const RATE_LIMIT_WINDOW_HOURS = 24; // Time window in hours

// Initialize Gemini AI
// API key should be set via: firebase functions:config:set gemini.api_key="YOUR_KEY"
const getGeminiAI = () => {
  const apiKey = functions.config().gemini?.api_key || process.env.VITE_GEMINI_AI_ID || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  Gemini API key not configured. AI processing will be skipped.');
    return null;
  }
  // Pass API key directly to constructor (not via env var)
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper function for stage sequencing
 * Determines the next appropriate stage based on current stage and AI detection
 */
const getNextStage = (currentStage, aiDetectedStage) => {
  const stageOrder = ['applied', 'screening', 'interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6', 'offer', 'rejected'];
  
  // If AI detected a specific stage, use it
  if (aiDetectedStage && stageOrder.includes(aiDetectedStage)) {
    return aiDetectedStage;
  }
  
  // Otherwise, determine next logical stage
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1) {
    return 'applied'; // Default if current stage not found
  }
  
  // Don't advance from final stages
  if (currentStage === 'offer' || currentStage === 'rejected') {
    return currentStage;
  }
  
  // Move to next stage
  const nextIndex = Math.min(currentIndex + 1, stageOrder.length - 1);
  return stageOrder[nextIndex];
};

/**
 * Receive and process emails from CloudMailin
 * CloudMailin sends emails as HTTP POST requests to this endpoint
 */
exports.receiveEmail = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for HTTP functions)
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
  // Set CORS headers for CloudMailin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Log what keys CloudMailin is sending
    
    // CloudMailin sends email data in this format
    const emailData = req.body;
    const { envelope, headers, plain, html } = emailData;
    
    // ========== PARSE EMAIL CONTENT ==========
    const emailContent = plain || html || '';
    
    // ========== 1. EXTRACT ORIGINAL SENDER ==========
    // When forwarded, the ORIGINAL sender (HR/recruiter) is in the forwarded content
    let originalSender = null;
    
    // Define multiple forwarding patterns for different email clients
    const forwardingPatterns = [
      // Gmail forwarding
      { name: 'Gmail', pattern: /[-]+\s*Forwarded message\s*[-]+[\s\S]*?From:\s*[^<]*<([^>]+@[^>]+)>/i },
      // Outlook forwarding  
      { name: 'Outlook', pattern: /-----Original Message-----[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      // Apple Mail forwarding
      { name: 'Apple Mail', pattern: /Begin forwarded message:[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      // Yahoo Mail forwarding
      { name: 'Yahoo', pattern: /----- Forwarded Message -----[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      // Generic forwarding patterns
      { name: 'Generic 1', pattern: /Forwarded message:[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      { name: 'Generic 2', pattern: /--- Forwarded message ---[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      { name: 'Mobile', pattern: /Forwarded by[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      // Simple forwarded patterns
      { name: 'Simple 1', pattern: /Forwarded:[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i },
      { name: 'Simple 2', pattern: /Fwd:[\s\S]*?From:\s*([^<\n]+@[^>\n]+)/i }
    ];
    
    // Try each forwarding pattern
    for (const { name, pattern } of forwardingPatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        originalSender = match[1].trim().replace(/[<>]/g, '');
        break;
      }
    }
    
    // FALLBACK 1: Look for any "From:" line with name and email (not in headers)
    if (!originalSender) {
      const fromMatch = emailContent.match(/From:\s*[^<]*<([^>]+@[^>]+)>/i);
      if (fromMatch) {
        originalSender = fromMatch[1].trim().replace(/[<>]/g, '');
      }
    }
    
    // FALLBACK 2: Look for any "From:" line (basic pattern)
    if (!originalSender) {
      const fromMatch = emailContent.match(/From:\s*([^<\n]+@[^>\n]+)/i);
      if (fromMatch) {
        originalSender = fromMatch[1].trim().replace(/[<>]/g, '');
      }
    }
    
    // FALLBACK 3: Look for email addresses in the content (avoid common forwarder patterns)
    if (!originalSender) {
      const emailMatches = emailContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
      if (emailMatches) {
        // Filter out common forwarder/relay patterns and personal email domains
        const filteredEmails = emailMatches.filter(email => {
          const lowerEmail = email.toLowerCase();
          return !lowerEmail.includes('eforward') && 
                 !lowerEmail.includes('registrar-servers') &&
                 !lowerEmail.includes('gmail.com') && // Avoid the forwarder's email
                 !lowerEmail.includes('outlook.com') &&
                 !lowerEmail.includes('yahoo.com') &&
                 !lowerEmail.includes('icloud.com') &&
                 !lowerEmail.includes('hotmail.com') &&
                 !lowerEmail.includes('live.com') &&
                 !lowerEmail.includes('aol.com') &&
                 !lowerEmail.includes('mail.com') &&
                 !lowerEmail.includes('protonmail.com') &&
                 !lowerEmail.includes('tutanota.com') &&
                 // Avoid common corporate domains that might be the forwarder
                 !lowerEmail.includes('company.com') && // Generic company domain
                 !lowerEmail.includes('example.com') &&
                 // Look for professional/corporate email patterns
                 (lowerEmail.includes('@') && 
                  !lowerEmail.includes('noreply') &&
                  !lowerEmail.includes('no-reply') &&
                  !lowerEmail.includes('donotreply'));
        });
        
        if (filteredEmails.length > 0) {
          originalSender = filteredEmails[0];
        }
      }
    }
    
    // FALLBACK 4: Check if this is a direct email (not forwarded)
    if (!originalSender && envelope.from && !envelope.from.includes('eforward')) {
      originalSender = envelope.from;
    }
    
    // FALLBACK 5: Use headers.From as last resort (usually the forwarder, not original)
    if (!originalSender && headers && headers.From) {
      const headerFromMatch = headers.From.match(/<?([^<\s]+@[^>\s]+)>?/);
      if (headerFromMatch) {
        originalSender = headerFromMatch[1].trim().replace(/[<>]/g, '');
      }
    }
    
    // ========== 2. EXTRACT FORWARDER EMAIL ==========
    // The forwarder is the user who sent the email to us (from envelope)
    let forwarderEmail = envelope.from;
    
    // Decode SRS (Sender Rewriting Scheme) from Namecheap email forwarding
    // Format: SRS0=HASH=TT=domain.com=username@eforward.registrar-servers.com
    // Example: SRS0=61A8=42=gmail.com=maihe88@eforward.registrar-servers.com
    if (forwarderEmail && forwarderEmail.includes('SRS0=')) {
      // Match: SRS0=hash=tt=DOMAIN=USERNAME@forwarder
      const srsMatch = forwarderEmail.match(/SRS0=[^=]+=\d+=([^=]+)=([^@]+)@/);
      if (srsMatch && srsMatch.length >= 3) {
        const domain = srsMatch[1];    // e.g., "gmail.com"
        const username = srsMatch[2];   // e.g., "maihe88"
        forwarderEmail = `${username}@${domain}`;
      }
    }
    
    // Also check for the original recipient in the forwarded message "To:" header
    const toMatch = emailContent.match(/[-]+\s*Forwarded message\s*[-]+[\s\S]*?To:\s*<?([^<\n]+@[^>\n]+)>?/i);
    if (toMatch && !forwarderEmail.includes('@')) {
      // If SRS parsing failed, use the "To:" from the forwarded message
      forwarderEmail = toMatch[1].trim().replace(/[<>]/g, '');
    }
    
    // Clean up email
    forwarderEmail = forwarderEmail.replace(/[<>]/g, '').trim();
    
    // ========== 3. EXTRACT RECEIVER EMAIL (xxxxx@jobsync.fyi) ==========
    // This is the tracking email where the user forwarded to
    let receiverEmail = envelope.to;
    
    // If forwarded through domain forwarding, check headers
    if (receiverEmail.includes('@cloudmailin.net')) {
      const possibleReceivers = [
        headers['X-Forwarded-To'],
        headers['x-forwarded-to'],
        headers['Delivered-To'],
        headers['delivered-to'],
        headers.To,
        headers.to
      ];
      
      for (const receiver of possibleReceivers) {
        if (receiver && receiver.includes('@jobsync.fyi')) {
          receiverEmail = receiver.replace(/[<>]/g, '').trim();
          break;
        }
      }
    }
    
    // Extract the tracking code (e.g., "ABC123" from "ABC123@jobsync.fyi")
    const emailCode = receiverEmail.split('@')[0].toUpperCase();
    
    // ========== 4. EXTRACT ORIGINAL SENT DATE ==========
    // Parse the Date from the FORWARDED message block (not the forwarding email's date)
    let originalSentDate = null;
    
    // Look for "Date:" in the forwarded message section
    const dateMatch = emailContent.match(/[-]+\s*Forwarded message\s*[-]+[\s\S]*?Date:\s*([^\n]+)/i);
    if (dateMatch && dateMatch[1]) {
      originalSentDate = dateMatch[1].trim();
    } else {
      // Fallback: try to find any Date: header
      const simpleDateMatch = emailContent.match(/Date:\s*([^\n]+)/i);
      if (simpleDateMatch) {
        originalSentDate = simpleDateMatch[1].trim();
      }
    }
    
    // Last fallback: use the email header date
    if (!originalSentDate) {
      originalSentDate = headers.Date || headers.date || new Date().toISOString();
    }
    
    // ========== 5. EXTRACT ORIGINAL SUBJECT ==========
    // Parse the Subject from the FORWARDED message block (not "Fwd: ...")
    let subject = '';
    
    // Look for "Subject:" in the forwarded message section
    const subjectMatch = emailContent.match(/[-]+\s*Forwarded message\s*[-]+[\s\S]*?Subject:\s*([^\n]+)/i);
    if (subjectMatch && subjectMatch[1]) {
      subject = subjectMatch[1].trim();
    } else {
      // Fallback: use the email header subject and remove "Fwd:" prefix
      subject = headers.Subject || headers.subject || '';
      subject = subject.replace(/^(Fwd?:\s*)+/i, '').trim();
    }
    
    // ========== 6. EXTRACT ORIGINAL CONTENT ==========
    // Extract only the ORIGINAL email body, not the forwarding headers
    let originalContent = emailContent;
    
    // Try to extract content after the forwarded message headers
    // Pattern: everything after "To: xxx" and before any signatures/replies
    const contentMatch = emailContent.match(/[-]+\s*Forwarded message\s*[-]+[\s\S]*?To:\s*[^\n]+\s*\n\s*\n([\s\S]+)/i);
    if (contentMatch && contentMatch[1]) {
      originalContent = contentMatch[1].trim();
      
      // Remove any trailing signatures or forwarding artifacts
      // Stop at common signature markers
      const sigMarkers = [
        /\n\s*--\s*\n/,  // "-- " signature delimiter
        /\n\s*[-]+\s*Forwarded message\s*[-]+/i,  // Another forward
        /\nOn .+ wrote:/i,  // Reply marker
      ];
      
      for (const marker of sigMarkers) {
        const match = originalContent.match(marker);
        if (match) {
          originalContent = originalContent.substring(0, match.index).trim();
        }
      }
    }
    
    // ========== LOG ALL EXTRACTED INFO ==========
    console.log('\n=== PARSED EMAIL DATA ===');
    console.log(`1. Original Sender: ${originalSender || 'Not found'}`);
    console.log(`2. Forwarder Email: ${forwarderEmail}`);
    console.log(`3. Receiver Email: ${receiverEmail}`);
    console.log(`4. Tracking Code: ${emailCode}`);
    console.log(`5. Original Sent Date: ${originalSentDate}`);
    console.log(`6. Subject: ${subject}`);
    console.log(`7. Content Type: ${plain ? 'plain' : 'html'}`);
    console.log(`8. Original Content Length: ${originalContent.length} chars`);
    console.log(`\n--- Original Content Preview (first 300 chars) ---`);
    console.log(originalContent.substring(0, 300));
    console.log(`--- End Preview ---\n`);
    console.log('========================\n');
    
    // Find user by tracking code
    const usersRef = admin.firestore().collection('users');
    const userQuery = await usersRef.where('emailCode', '==', emailCode).limit(1).get();
    
    if (userQuery.empty) {
      console.log(`⚠️  No user found with tracking code: ${emailCode}`);
      return res.status(200).send('OK'); // Still return 200 to CloudMailin
    }
    
    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✅ Found user: ${userData.email}`);
    
    // ========== RATE LIMITING: Check daily email count ==========
    const isRateLimited = await checkRateLimit(forwarderEmail, userId);
    if (isRateLimited) {
      console.log(`⛔ Rate limit exceeded for ${forwarderEmail} (100 emails/day)`);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'You have reached the daily limit of 100 forwarded emails. Please try again tomorrow.',
        forwarder_email: forwarderEmail
      });
    }
    
    // Store email in 'mailin' collection - ONLY the parsed fields + Update_Time
    const emailRef = await admin.firestore().collection('mailin').add({
      Original_Sender: originalSender,           // 1. Original sender (HR/recruiter)
      Forwarder_Email: forwarderEmail,           // 2. Who forwarded it (the user)
      Receiver_Email: receiverEmail,             // 3. Where it was sent (xxxxx@jobsync.fyi)
      Tracking_Code: emailCode,                  // 4. Tracking code (ABC123)
      Original_Sent_At: originalSentDate,        // 5. When original email was sent
      Subject: subject,                          // 6. Original email subject
      Content_Details: originalContent,          // 7. Original email body (cleaned)
      Update_Time: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ Stored email in 'mailin' collection with ID: ${emailRef.id}`);
    
    // Respond to CloudMailin immediately (don't wait for AI processing)
    res.status(200).send('Email received and queued for processing');
    
    // Process email with AI asynchronously (don't block response)
    processEmailWithAI(
      emailRef.id,
      userId,
      emailCode,
      originalSender,
      forwarderEmail,
      subject,
      originalContent,
      originalSentDate
    ).catch(error => {
      console.error('❌ AI processing error:', error);
    });
    
  } catch (error) {
    console.error('Error processing email:', error);
    // Still return 200 to CloudMailin to avoid retries
    res.status(200).send('Error logged');
  }
});

/**
 * Process email with Gemini AI to extract job application data
 * Creates/updates jobs collection and creates job_details entry
 */
async function processEmailWithAI(
  emailId,
  userId,
  trackingCode,
  originalSender,
  forwarderEmail,
  subject,
  content,
  sentDate
) {
  try {
    console.log(`\n🤖 Starting AI analysis for email: ${emailId}`);
    
    const genAI = getGeminiAI();
    if (!genAI) {
      console.log('⚠️  Skipping AI processing - API key not configured');
      return;
    }
    
    // Construct prompt for AI
    const prompt = `Analyze this job application email and extract structured information.

EMAIL DETAILS:
From: ${originalSender}
Subject: ${subject}
Date: ${sentDate}
Content: ${content}

Extract the following information (return "null" if not found):
1. Company name
2. Job title/position
3. Current stage (one of: applied, screening, interview1, interview2, interview3, interview4, offer, rejected)
4. Salary range (if mentioned)
5. Location (if mentioned)
6. Recruiter/contact name (if mentioned)
7. Brief summary of this email (1-2 sentences)
8. Any important notes or action items

Respond ONLY with valid JSON in this exact format (use JSON null, not string "null"):
{
  "company": "Company Name",
  "job_title": "Job Title",
  "current_stage": "rejected",
  "salary": null,
  "location": null,
  "contact": "email@example.com",
  "email_summary": "Brief summary here",
  "notes": null
}`;

    // Call Gemini AI with the new @google/genai API
    console.log('📤 Sending prompt to Gemini AI...');
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    const aiText = response.text;
    
    console.log('📥 Received AI response:', aiText.substring(0, 200));
    
    // Parse AI response
    let aiData;
    try {
      // Extract JSON from response (AI might wrap it in markdown code blocks)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      aiData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiText);
      return;
    }
    
    console.log('✅ Parsed AI data:', JSON.stringify(aiData, null, 2));
    
    // Find or create job in jobs collection
    const jobsRef = admin.firestore().collection('jobs');
    let jobId = null;
    let isNewJob = false;
    let updatedStage = aiData.current_stage || 'applied'; // Track the stage for job_details
    
    // Normalize company and job title for better matching
    const normalizedCompany = aiData.company?.trim().toLowerCase();
    const normalizedJobTitle = aiData.job_title?.trim().toLowerCase();
    
    // Try to find existing job by user and tracking code first
    if (normalizedCompany && normalizedJobTitle) {
      // Get all jobs for this user
      const userJobsQuery = await jobsRef
        .where('User_ID', '==', userId)
        .where('Tracking_Code', '==', trackingCode)
        .get();
      
      // Find matching job with case-insensitive comparison
      let matchingJob = null;
      for (const doc of userJobsQuery.docs) {
        const jobData = doc.data();
        const jobCompany = jobData.Company?.trim().toLowerCase();
        const jobTitle = jobData.Job_Title?.trim().toLowerCase();
        
        // Check for exact match or fuzzy match
        if (jobCompany === normalizedCompany && jobTitle === normalizedJobTitle) {
          matchingJob = doc;
          break;
        }
        
        // Also check if job title is contained in the other (for variations)
        if (jobCompany === normalizedCompany && 
            (jobTitle?.includes(normalizedJobTitle) || normalizedJobTitle?.includes(jobTitle))) {
          matchingJob = doc;
          break;
        }
      }
      
      if (matchingJob) {
        // Update existing job
        jobId = matchingJob.id;
        const existingData = matchingJob.data();
        
        // Determine the next stage using our helper function
        const currentStage = existingData.Current_Stage || 'applied';
        const nextStage = getNextStage(currentStage, aiData.current_stage);
        updatedStage = nextStage; // Store for job_details
        
        await matchingJob.ref.update({
          Current_Stage: nextStage,
          Salary: aiData.salary || existingData.Salary || null,
          Location: aiData.location || existingData.Location || null,
          Contact: aiData.contact || existingData.Contact || null,
          Last_Updated: admin.firestore.FieldValue.serverTimestamp(),
          Update_Time: admin.firestore.FieldValue.serverTimestamp(),
          Email_IDs: admin.firestore.FieldValue.arrayUnion(emailId),
          Notes: aiData.notes || existingData.Notes || null
        });
      } else {
        isNewJob = true;
      }
    } else {
      isNewJob = true;
    }
    
    // Create new job if not found
    if (isNewJob) {
      const newJobData = {
        User_ID: userId,
        Tracking_Code: trackingCode,
        Company: aiData.company || 'Unknown Company',
        Job_Title: aiData.job_title || 'Unknown Position',
        Salary: aiData.salary || null,
        Location: aiData.location || null,
        Contact: aiData.contact || null,
        Current_Stage: aiData.current_stage || 'applied',
        Applied_Date: admin.firestore.FieldValue.serverTimestamp(),
        Last_Updated: admin.firestore.FieldValue.serverTimestamp(),
        Update_Time: admin.firestore.FieldValue.serverTimestamp(),
        Email_IDs: [emailId],
        Notes: aiData.notes || null
      };
      
      const newJobRef = await jobsRef.add(newJobData);
      jobId = newJobRef.id;
    }
    
    // Create job_details entry (timeline entry for this email)
    
    const jobDetailsData = {
      Job_ID: jobId,
      User_ID: userId,
      Tracking_Code: trackingCode,
      Email_ID: emailId,
      Stage: updatedStage,
      Subject: subject,
      Sender: originalSender,
      Sent_Date: sentDate,
      Content_Summary: aiData.email_summary || content.substring(0, 200),
      Notes: aiData.notes || null,
      Update_Time: admin.firestore.FieldValue.serverTimestamp()
    };
    
    let jobDetailsRef;
    try {
      jobDetailsRef = await admin.firestore().collection('job_details').add(jobDetailsData);
    } catch (detailsError) {
      // Try one more time
      jobDetailsRef = await admin.firestore().collection('job_details').add(jobDetailsData);
    }
    
    // Update mailin document with processing status
    try {
      await admin.firestore().collection('mailin').doc(emailId).update({
        Processed: true,
        Job_ID: jobId,
        Processing_Status: 'completed',
        Update_Time: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      // Non-critical error, continue execution
    }
    
  } catch (error) {
    // Mark email as failed
    try {
      await admin.firestore().collection('mailin').doc(emailId).update({
        Processed: false,
        Processing_Status: 'failed',
        Processing_Error: error.message,
        Update_Time: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      // Failed to update error status
    }
  }
}

/**
 * Check if forwarder has exceeded daily rate limit
 * @param {string} forwarderEmail - The email address of the forwarder
 * @param {string} userId - The user ID for logging purposes
 * @returns {Promise<boolean>} - True if rate limited, false if OK to proceed
 */
async function checkRateLimit(forwarderEmail, userId) {
  try {
    const db = admin.firestore();
    const now = new Date();
    const windowStart = new Date(now.getTime() - (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    
    // Create a unique document ID based on forwarder email and date
    // This allows daily resets and easy tracking
    const dateKey = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const rateLimitDocId = `${forwarderEmail}_${dateKey}`;
    const rateLimitRef = db.collection('rate_limits').doc(rateLimitDocId);
    
    // Use transaction to ensure atomic increment
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // First email of the day
        transaction.set(rateLimitRef, {
          forwarder_email: forwarderEmail,
          user_id: userId,
          count: 1,
          date: dateKey,
          window_start: admin.firestore.Timestamp.fromDate(now),
          last_email: admin.firestore.Timestamp.fromDate(now),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return { isLimited: false, count: 1 };
      }
      
      const data = doc.data();
      const currentCount = data.count || 0;
      
      // Check if limit exceeded
      if (currentCount >= RATE_LIMIT_MAX_EMAILS) {
        console.log(`⚠️  Rate limit reached: ${currentCount}/${RATE_LIMIT_MAX_EMAILS} for ${forwarderEmail}`);
        
        // Update rejected count for monitoring
        transaction.update(rateLimitRef, {
          rejected_count: admin.firestore.FieldValue.increment(1),
          last_rejected: admin.firestore.Timestamp.fromDate(now)
        });
        
        return { isLimited: true, count: currentCount };
      }
      
      // Increment counter
      transaction.update(rateLimitRef, {
        count: admin.firestore.FieldValue.increment(1),
        last_email: admin.firestore.Timestamp.fromDate(now)
      });
      
      return { isLimited: false, count: currentCount + 1 };
    });
    
    console.log(`📊 Rate limit check for ${forwarderEmail}: ${result.count}/${RATE_LIMIT_MAX_EMAILS}`);
    return result.isLimited;
    
  } catch (error) {
    console.error('❌ Error checking rate limit:', error);
    // On error, allow the email through (fail open)
    // You can change this to "fail closed" by returning true
    return false;
  }
}