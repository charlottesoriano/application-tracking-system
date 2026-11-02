interface Job {
    title: string;
    description: string;
    location: string;
    requiredSkills: string[];
}

type ResumeStatus = "processing" | "done" | "failed";

interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    imagePath: string;
    resumePath: string;
    feedback?: Feedback;
    status?: ResumeStatus;
    error?: string;
    createdAt?: string;
}

// The user's default resume, uploaded once and shared by any application
// submitted with "Use main resume" (those entries point at these same paths).
interface MainResume {
    resumePath: string;
    imagePath: string;
    fileName: string;
    size: number;
    uploadedAt: string;
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}