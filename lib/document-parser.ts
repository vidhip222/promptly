// Document parsing utilities
export async function parseDocument(buffer: Buffer, fileType: string): Promise<string> {
  try {
    console.log(`Parsing document of type: ${fileType}`)

    if (fileType === "text/plain") {
      const text = buffer.toString("utf-8")
      console.log(`Plain text parsed, length: ${text.length}`)
      return text
    }

    if (fileType === "text/csv") {
      const text = buffer.toString("utf-8")
      console.log(`CSV parsed, length: ${text.length}`)
      return text
    }

    if (fileType === "application/pdf") {
      // For production, implement PDF parsing with pdf-parse or similar
      // For now, return a mock response based on file size
      const mockContent = `[PDF Content - ${Math.round(buffer.length / 1024)}KB]
      
This PDF document contains important information about company policies, procedures, and guidelines. The document includes:

1. Introduction and Overview
   - Company mission and values
   - Document purpose and scope
   - How to use this guide

2. Policies and Procedures
   - Employee conduct guidelines
   - Safety protocols and requirements
   - Communication standards
   - Performance expectations

3. Benefits and Compensation
   - Health insurance options
   - Retirement planning
   - Paid time off policies
   - Professional development opportunities

4. Compliance and Legal
   - Regulatory requirements
   - Data protection policies
   - Equal opportunity guidelines
   - Grievance procedures

5. Resources and Contacts
   - HR department information
   - Emergency contacts
   - Useful links and references
   - FAQ section

This document serves as a comprehensive guide for employees and contains detailed information that can be used to answer questions about company policies, procedures, and benefits.`

      console.log(`PDF mock content generated, length: ${mockContent.length}`)
      return mockContent
    }

    if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // For production, implement DOCX parsing with mammoth or similar
      const mockContent = `[DOCX Content - ${Math.round(buffer.length / 1024)}KB]
      
Employee Handbook and Guidelines

Table of Contents:
1. Welcome to Our Company
2. Employment Policies
3. Code of Conduct
4. Benefits Overview
5. Performance Management
6. Professional Development

Chapter 1: Welcome to Our Company
Welcome to our organization! This handbook provides essential information about our company culture, policies, and procedures. Please read through this document carefully and keep it as a reference.

Chapter 2: Employment Policies
Our employment policies are designed to create a fair and productive work environment. Key policies include:
- Equal opportunity employment
- Anti-discrimination and harassment
- Work schedule and attendance
- Remote work guidelines
- Leave policies (vacation, sick, family)

Chapter 3: Code of Conduct
All employees are expected to maintain high standards of professional conduct:
- Respect for colleagues and clients
- Confidentiality and data protection
- Conflict of interest guidelines
- Social media and communication standards

Chapter 4: Benefits Overview
We offer comprehensive benefits to support our employees:
- Health, dental, and vision insurance
- Retirement savings plan with company matching
- Professional development budget
- Flexible work arrangements
- Employee assistance programs

Chapter 5: Performance Management
Our performance management system includes:
- Regular feedback and check-ins
- Annual performance reviews
- Goal setting and tracking
- Career development planning
- Recognition and rewards programs

This handbook is regularly updated to reflect current policies and procedures.`

      console.log(`DOCX mock content generated, length: ${mockContent.length}`)
      return mockContent
    }

    // Default to text parsing for unknown types
    const text = buffer.toString("utf-8")
    console.log(`Default text parsing, length: ${text.length}`)
    return text
  } catch (error) {
    console.error("Document parsing error:", error)
    throw new Error(`Failed to parse document: ${error.message}`)
  }
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const words = text.split(/\s+/).filter((word) => word.length > 0)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ")
    if (chunk.trim()) {
      chunks.push(chunk.trim())
    }
  }

  console.log(`Text chunked into ${chunks.length} pieces`)
  return chunks
}
