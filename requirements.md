**SPOT POLL Application**

This application allows users to create anonymous polls for people to participate in.

Users who migh need to create polls:

* Public speakers
* Teachers
* Managers
* Marketing Teams
* etc.

User who take the polls:

* Audiences
* Potential or Current Customers
* Crowds
* Employees

The application is intended for "pop-up" polls, typically administered in real time. For example, a speaker at a trade event might say, "Let's take a quick poll together." The speaker then shares the website and a unique code for the poll. Or, the speaker may show a QR code that members of the audience can scan. The participants, once in the web application, are presented the poll and answers the questions at their pace. On an overhead screen, real-time stats on audience responses can be seen, or the speaker chan choose to hide responses until the end.

There are many other detailed features to work through, but this is one baseline use case.

** Components of the Application**

1. HTML/JS/CSS front end
   1. Poll Creator interface
      1. Create polls
      2. Manage existing polls
      3. Control the release of polls and questions
      4. Control display of poll results
      5. Close and Delete polls
   2. Live Event Screen interface
      1. Shows participation QR code
      2. Shows poll statuses
         1. Name of poll
         2. Number of current participants
         3. Status of questions - answers per question, for example
         4. Final answers (either real-time or when Poll Creator releases)
   3. End-User interface
      1. Open poll
      2. Wait for poll release
      3. Wait for questions release
      4. Answer questions
      5. Allow edit of answers
      6. Submit all answers at the end
      7. Show QR code to someone nearby so they can participate in same poll
2. Python Back-end API JSON Storage Engine Object list
    1. DEPRECATED - NOT NEEDED -> Creator - who created and owns the poll
    2. Poll - poll name, description, number of times it's bee administered
    3. Poll Question - many questions per poll
    4. Poll Instance - a record of each time the poll was administered
    5. Poll Instance Participants - anonymous tracking information for participants
    6. Participant Answer - each answer for current instance of this poll

**JSON Storage Instance Relationships**

* DEPRECATED - NOT NEEDED -> Creator creates many Polls
* Polls contain many Poll Questions
* Polls are released to participants as Poll Instances
* Poll Instance Participants join a Poll Instance
* Poll Instance Participants answer Poll Questions for this Poll which is stored in Participant Answers

Another way to represent as relational tables and fields ([PK] and [FK] designates Primary Keys and Foreign Keys)
* DEPRECATED - NOT NEEDED -> Table Name: CREATOR
  * CreatorID: [PK] GUID
* Table Name: POLL
  * PollID: [PK] GUID
  * CreatorID: [FK] GUID
  * PollName: STRING
  * PollCreationDate: DATETIME
  * PollLockedForEditing: BOOL
    * Added per the clarifications document
    * Set to True when a user visits the Poll editor with the correct GUID. If page detects no activity after 5 minutes, Lock is removed and user must re-enter the GUID.
* Table Name: POLL_QUESTION
  * PollQuestionID: [PK] GUID
  * PollID: [FK] GUID
  * PollQuestionIndex: INTEGER
  * PollQuestionText: STRING
  * PollQuestionType: STRING
    * Valid Values: "NUM", "YES_NO", "PICK_ONE", "PICK_MANY", "RANK"
  * PollQuestionTypeChoices: STRING
    * An array of strings to meet the requirements of the Type above, for example:
      * NUM: an array of strings designating a numerical range, i.e., [1,20], "A number between 1 and 20, inclusive"
      * YES_NO: requires no array
      * PICK_ONE: ["Apple", "Orange", "Mango]
      * PICK_MANY: same as Pick_One
      * RANK: same as Pick_One
* Table Name: POLL_INSTANCE
  * PollInstanceID: [PK] GUID
  * PollID: [FK] GUID
  * PollInstanceDate: DATETIME
  * PollInstanceDescription: STRING
  * PollInstanceReleased: BOOL
  * PollInstanceQuestionsReleased: STRING
    * An array of GUIDs of questions participants are allowed to answer
* Table Name: POLL_INSTANCE_PARTICIPANT
  * PollInstanceParticipantID: [PK] GUID
  * PollInstanceID: [FK] GUID
  * PollInstanceParticipantDate: DATETIME
* Table Name: POLL_INSTANCE_PARTICIPANT_ANSWER
  * PollInstanceParticipantAnswerID: [PK] GUID
  * PollInstanceParticipantID: [FK] GUID
  * PollInstanceID: [FK] GUID
  * PollQuestionID: [PK] GUID
  * PollInstanceParticipantAnswer: STRING 