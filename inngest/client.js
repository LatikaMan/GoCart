import { Inngest } from "inngest";

export const inngest = new Inngest({ 
  id: "GoCart-ecommerce",
  // Yeh line ensure karegi ki cloud mode me key strictly pick ho sake
  signingKey: process.env.INNGEST_SIGNING_KEY, 
});