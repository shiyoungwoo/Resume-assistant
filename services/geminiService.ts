import { GoogleGenAI, Chat, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check API Key
const checkApiKey = () => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
};

export type ContentInput = 
  | { type: 'text'; content: string }
  | { type: 'file'; mimeType: string; data: string }; // data is base64

export const optimizeResume = async (
  resume: ContentInput, 
  jd: ContentInput
): Promise<string> => {
  checkApiKey();
  try {
    const parts: any[] = [];

    // 1. Process Resume Input
    if (resume.type === 'text') {
      parts.push({ text: `RESUME CONTENT:\n${resume.content}` });
    } else {
      parts.push({ text: `RESUME FILE (Analyze this document):` });
      parts.push({ 
        inlineData: { 
          mimeType: resume.mimeType, 
          data: resume.data 
        } 
      });
    }

    // 2. Process JD Input
    if (jd.type === 'text') {
      parts.push({ text: `JOB DESCRIPTION:\n${jd.content}` });
    } else {
      parts.push({ text: `JOB DESCRIPTION IMAGE (Analyze this image):` });
      parts.push({ 
        inlineData: { 
          mimeType: jd.mimeType, 
          data: jd.data 
        } 
      });
    }

    // 3. Add Instructions
    parts.push({
      text: `
        Act as a Senior HR Specialist and Resume Writer. 
        Analyze the provided resume (text or file) against the Job Description (text or image).
        
        CRITICAL INSTRUCTION:
        Detect the language of the JOB DESCRIPTION (JD). 
        You MUST write the entire output report in that SAME language. 
        If the JD is in Chinese, write the report in Chinese. 
        If the JD is in English, write the report in English.
        
        Your task:
        1. Analyze the match between the resume and the JD.
        2. Rewrite the "Professional Summary" to highlight relevant keywords from the JD.
        3. Suggest 3-5 concrete bullet point improvements for the experience section to better align with the role.
        4. List missing keywords that are crucial for this specific JD.
        
        Output Format: Markdown. Use headers for sections.
      `
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });

    return response.text || "Failed to generate optimization suggestions.";
  } catch (error) {
    console.error("Error optimizing resume:", error);
    return "An error occurred while communicating with the AI. Please ensure your file type is supported (PDF, PNG, JPEG, WEBP) and try again.";
  }
};

export const applyOptimizationToResume = async (
  originalResume: string,
  optimizationReport: string
): Promise<any> => {
  checkApiKey();
  try {
    const prompt = `
      I have an original resume and an optimization report with suggestions.
      Please merge them to create a structured JSON representation of the NEW, IMPROVED resume.
      
      Original Resume:
      ${originalResume.substring(0, 5000)}
      
      Optimization Suggestions:
      ${optimizationReport.substring(0, 5000)}
      
      Instructions:
      1. Extract personal info from Original Resume.
      2. Use the 'Professional Summary' from the suggestions (or improve the original if not explicit).
      3. For 'Experiences', keep the original history but REWRITE the descriptions/bullet points based on the optimization suggestions to make them stronger.
      4. Extract or refine 'Skills'.
      
      Return JSON strictly matching this schema:
      {
        "personalInfo": { "name": "", "email": "", "phone": "", "linkedin": "" },
        "summary": "...",
        "experiences": [ { "id": "1", "role": "...", "company": "...", "duration": "...", "description": "..." } ],
        "skills": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    // Clean potential markdown blocks just in case
    const cleanJson = (response.text || "{}").replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error structuring resume:", error);
    return null;
  }
};

export const generateInterviewQuestions = async (
  company: string, 
  role: string,
  existingQuestions: string[] = []
): Promise<string> => {
  checkApiKey();
  try {
    const prompt = `
      You are an expert Interview Coach.
      Generate a curated list of 3-5 NEW highly relevant interview questions for the position of "${role}" at "${company}".
      
      Existing questions (DO NOT REPEAT THESE):
      ${JSON.stringify(existingQuestions)}
      
      Sources to simulate/derive questions from:
      1. [Community]: Questions commonly shared by other candidates online for this company/role.
      2. [Resume Probe]: Hypothetical deep-dive questions that would target a candidate's resume "Extended" details (gaps, project specifics, impact).
      3. [Role Requirement]: Core technical or hard-skill questions required for the job description.
      
      Output Format: JSON array of objects.
      Schema:
      {
        "question": "The question text",
        "type": "Behavioral" | "Technical" | "System Design" | "Cultural Fit",
        "source": "Community" | "Resume Probe" | "Role Requirement",
        "hint": "Brief advice on how to answer."
      }
      
      Ensure a mix of sources and offer new perspectives not covered in existing questions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return response.text || "[]";
  } catch (error) {
    console.error("Error generating questions:", error);
    return "[]";
  }
};

export const generateAnswerHelp = async (question: string, draft: string): Promise<string> => {
  checkApiKey();
  try {
    const prompt = `
      The user is preparing for an interview.
      Question: "${question}"
      User's Draft Answer: "${draft}"
      
      Task:
      If the draft is empty, provide a structured outline or bullet points on how to answer effectively.
      If the draft is present, refine it to be more professional, using the STAR method if applicable, and correct any obvious weaknesses.
      
      Keep the response concise and encouraging.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Could not generate hints.";
  } catch(e) {
    return "Error generating hints.";
  }
};

export const generateSelfIntroFromResume = async (
  resumeText: string, 
  role: string, 
  company: string
): Promise<{rationale: string, script: string} | null> => {
  checkApiKey();
  try {
    const prompt = `
      You are a professional Interview Coach.
      Based on the candidate's resume and the target role of "${role}" at "${company}", create a powerful Self-Introduction.
      
      Resume Context:
      ${resumeText.substring(0, 3000)}
      
      Output Requirement (JSON):
      {
        "rationale": "A brief explanation (2-3 sentences) of the strategy used. Why highlight these specific experiences? How does it fit the company culture?",
        "script": "The actual spoken self-introduction text. First person. Professional, engaging, and under 2 minutes."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const cleanJson = (response.text || "{}").replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating self intro:", error);
    return null;
  }
};

export const refineSelfIntro = async (draft: string, role: string, company: string): Promise<string> => {
  checkApiKey();
  try {
    const prompt = `
      Refine the following self-introduction for a ${role} interview at ${company}.
      Make it professional, engaging, and concise (under 2 minutes spoken).
      
      Draft: "${draft}"
      
      Output:
      1. Polished Version.
      2. Critique (What was improved).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not refine text.";
  } catch (error) {
    console.error("Error refining intro:", error);
    return "Error processing request.";
  }
};

export const generateCareerInsights = async (
  resumeInput: ContentInput,
  interviewHistory: any[]
): Promise<any> => {
  checkApiKey();
  try {
    const parts: any[] = [];

    // 1. Process Resume Input
    if (resumeInput.type === 'text') {
      parts.push({ text: `CANDIDATE RESUME:\n${resumeInput.content}` });
    } else {
      parts.push({ text: `CANDIDATE RESUME (Analyze this file):` });
      parts.push({ 
        inlineData: { 
          mimeType: resumeInput.mimeType, 
          data: resumeInput.data 
        } 
      });
    }

    // 2. Add History & Instructions
    parts.push({
      text: `
        Act as a Senior Career Counselor.
        
        Recent Interview Activity (History): 
        ${JSON.stringify(interviewHistory)}
        
        Task:
        Based on the skills in the resume and the recent interview outcomes (Passed/Failed), provide strategic career advice.
        If the resume is sparse, suggest adding more details.
        
        Output JSON Schema:
        {
          "recommendedRole": "Specific Job Title (e.g., Senior Backend Architect)",
          "industryFit": "Best Industry (e.g., Fintech, HealthTech)",
          "strengths": ["Key Strength 1", "Key Strength 2"],
          "improvementAreas": ["Area 1", "Area 2"],
          "rationale": "Brief explanation of why this path is recommended."
        }
      `
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      }
    });

    const cleanJson = (response.text || "{}").replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating career insights:", error);
    return null;
  }
};

export const createMockInterviewChat = (company: string, role: string): Chat => {
  checkApiKey();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a strict but fair interviewer for ${company}, interviewing a candidate for the ${role} position. 
      Start by asking the candidate to introduce themselves. 
      Then, ask one question at a time based on their responses. 
      After the candidate answers, provide brief feedback (1-2 sentences) on their answer quality before asking the next question.
      Keep the tone professional.`,
    },
  });
};