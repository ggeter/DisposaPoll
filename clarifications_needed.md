# Key Areas Needing Clarification in requirements.md

Based on a review of the requirements.md document, the following areas require further clarification to develop a comprehensive requirements specification suitable for implementation:

1. **Authentication and User Management**:
   - How do creators register, login, and manage accounts?
     - Creators don't register. Both creators and participants are anonymous all the time.
     - When a creator visits a page, they are prompted to either begin creating a new poll, or are asked to enter the unique Poll GUID for the poll they wich to manage
     - The GUID can also be embedded in a "Magic URL" the creator can save to bookmarks or other tool for safekeeping
     - All this said, there is no need for a Creator object in the database. I will mark those objects as DEPRECATED in the requirements.md doc.
   - Is there support for multiple creators or shared access?
     - Yes, anyone with the Poll GUID or "Magic Link" can manage the poll
     - However, only one person can be managing the poll at a time. I have added a Lock field to the Poll object to track this.
   - Any security requirements (e.g., password policies, 2FA)?
     - None. Magic Links and GUIDs only.

2. **Anonymity and Privacy**:
   - How is participant anonymity ensured? What data is collected (e.g., IP addresses)?
     - Nothing is collected. When the user enters the Poll Instance GUID or visits the QR code "Magic Link" for the Poll Instance, they are assigned an internal GUID (PollInstanceParticipantID) and then Authorized to participate. The application needs nothing.
   - Compliance with privacy regulations like GDPR?
     - I can't imagine we'd need to worry about that since we will make all efforts to collect nothing from the user.

3. **Poll Question Types and Mechanics**:
   - Detailed behavior for each type (NUM, YES_NO, PICK_ONE, PICK_MANY, RANK).
     - YES_NO and PICK_ONE render as simple dropboxes
     - PICK_MANY render as radio button selections
   - For NUM: How to handle ranges, validation?
     - Simple JavaScript feedback. Ranges are always inclusive.
     - Input is a simple text box that ensures mobile device shows the numeric keyboard
   - For RANK: How does ranking work (e.g., drag-and-drop UI)?
     - If it's stable on mobile, drag and drop would be great. Show all choices with a clear drag handle and user can move them around
     - Add a "Save Order" button under the list so user can confirm the order (this ensures that they acknowledge their choice and prevents saving the "default" order as their answer)
   - Editing answers: Under what conditions can participants edit?
     - They can edit questions where PollQuestionID is in PollInstanceQuestionsReleased collection and PollInstanceReleased = TRUE
   - Submission: Must all questions be answered before submission?
     - No. User can submit at any time, even with blank answers.
     - HOWEVER, user answers are saved to server upon every click of any answer in case their session needs to be reloaded.

4. **Real-time Features and Implementation**:
   - How to handle real-time updates for results (e.g., WebSockets, polling)?
     - Real time means "eventually consistent" within 5 seconds. Your choice on the tech.
   - Controls for hiding/showing results in real-time.
     - The Poll creator interface 
   - Performance considerations for large audiences.

5. **Data Storage and Backend**:
   - Clarify JSON storage vs. relational model (document mixes both).
   - Field types: E.g., PollQuestionTypeChoices is STRING but described as array.
   - PollInstanceQuestionsReleased: Described as array of GUIDs but typed as STRING.
   - Storage engine: Python backend with JSON – details on persistence (files, database)?

6. **Poll Management and Lifecycle**:
   - Creating, managing, closing, deleting polls.
   - Reusing polls (multiple instances).
   - Tracking number of administrations.

7. **User Interfaces**:
   - Specific UI/UX details for creator interface, live event screen, end-user interface.
   - QR code generation and sharing.
   - Mobile responsiveness.

8. **Additional Features and Edge Cases**:
   - Handling multiple participants, concurrent access.
   - Error handling, validation.
   - Analytics or reporting beyond basic stats.

These clarifications will help refine the requirements for a robust polling application.