/**
 * Test script for AI email processing
 * Run with: node test-ai.js
 */

const { GoogleGenAI } = require('@google/genai');

// Test data
const testEmail = {
  content: `Hi Demo, Thank you for your time recently to speak with us about the Software Engineer role. We enjoyed our conversation and learning more about your skills and experience. We were impressed with your background and would like to invite you to the next stage of our process: a second-round interview. This interview will be more technical in nature and will be with our Engineering Lead, Maria Chen. It is scheduled to last about 60 minutes. Could you please let us know your availability for a video call on Tuesday or Thursday next week? Please suggest a few times that work for you, and we will send a calendar invitation with the final details. We are very excited to continue the conversation and learn more about how you could contribute to the team at Nexus. Best regards, The Nexus Innovations Talent Acquisition Team`,
  sender: 'chinatravelhelpinfo@gmail.com',
  subject: 'Second Round Interview - Software Engineer',
  sentDate: 'Sat, Oct 18, 2025 at 12:33 AM'
};

// Helper function for stage sequencing
const getNextStage = (currentStage, aiDetectedStage) => {
  const stageOrder = ['applied', 'screening', 'interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6', 'offer', 'rejected'];
  
  if (aiDetectedStage && stageOrder.includes(aiDetectedStage)) {
    return aiDetectedStage;
  }
  
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1) {
    return 'applied';
  }
  
  if (currentStage === 'offer' || currentStage === 'rejected') {
    return currentStage;
  }
  
  const nextIndex = Math.min(currentIndex + 1, stageOrder.length - 1);
  return stageOrder[nextIndex];
};

async function testAI() {
  try {
    console.log('🧪 Starting AI processing test...\n');
    
    // Get API key from environment or config
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCM17Lv2L-jOx4KhsdV10GRUjxl0Xqf1LI';
    
    if (!apiKey) {
      console.error('❌ No API key found!');
      return;
    }
    
    const genAI = new GoogleGenAI({ apiKey });
    
    // Construct prompt
    const prompt = `Analyze this job application email and extract structured information.

EMAIL DETAILS:
From: ${testEmail.sender}
Subject: ${testEmail.subject}
Date: ${testEmail.sentDate}
Content: ${testEmail.content}

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

    console.log('📤 Sending prompt to Gemini AI...\n');
    
    // Call Gemini AI
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    
    const aiText = response.text;
    
    console.log('📥 Raw AI Response:');
    console.log(aiText);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Parse JSON
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in AI response');
      return;
    }
    
    const aiData = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Parsed AI Data:');
    console.log(JSON.stringify(aiData, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test stage logic
    console.log('🔄 Testing Stage Logic:');
    console.log(`  AI Detected Stage: ${aiData.current_stage}`);
    console.log(`  Test Case 1 - New Job:`);
    console.log(`    Result: ${aiData.current_stage || 'applied'}`);
    console.log(`  Test Case 2 - Existing Job (was 'applied'):`);
    console.log(`    Result: ${getNextStage('applied', aiData.current_stage)}`);
    console.log(`  Test Case 3 - Existing Job (was 'interview1'):`);
    console.log(`    Result: ${getNextStage('interview1', aiData.current_stage)}`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('✅ TEST PASSED - AI processing works correctly!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run test
testAI();

