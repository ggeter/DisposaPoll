**DisposaPoll Application**

This application allows users to create anonymous polls for people to participate in. The polls are accessible only via magic links. No logins. If a poll is not viewed/used via any magic link in 30 days, the poll and its data disappears.

Users who might need to create polls:

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
      1. Login without a username or email or passoword. Just visit the site and click "Create New Poll" and the poll creation interface is started, with the magic link peristent in the URL bar (and also cpoy-able with a button that's always at the top of the screen). 
      2. IF USER IS VISITNG PAGE WITH A MAGIC LINK
         1. The link has one of three modes: Owner, ResultsViewer, PollTaker
         2. "Owner" link allows user to edit poll (a poll with at least one response is uneditable), delete the poll at that magic link, and copy the two other magic links for distrubution (also available via Copy buttons at top of screen in Owner mode). When owner is done creating the poll, they simply post the magic link to accept responses. If the Owner wishes to submit the poll for another event, the Owner can "Make Copy of Poll" which copies the current poll definitions and redirects to a new magic link for the new poll.
         3. "ResultsViewer" shows results of the poll in real time, all responses on one screen, using **MERMAID** for graphs
         4. "PollTaker" presents the visitor with the poll, which the can **ONLY TAKE ONCE**
   2. Live Event Screen interface - using Owner mode:
      1. Shows participation QR codes (which resolves into the magic link for PollTaker or ResultsViewer)
      2. Shows poll statuses
         1. Name of poll
         2. Number of current participants
   3. End-User interface - using PollTaker mode:
      1. Open poll with magic link
      2. Answer questions
      3. Submit all answers at the end
      4. Show QR code to someone nearby so they can participate in same poll
2. CLOUDFLARE BACK END - use Cloudflare tools appropriate for hosting page and storing information
    1. Store poll definitions
    2. Store magic link codes for the three modes of each poll
    3. Store poll responses by respondant
    4. Store poll responses in aggregate as responses are collected

**JSON Storage Instance Relationships**

* Polls contain many Poll Questions
* Poll Instance Participants join a Poll Instance
* Poll Instance Participants answer Poll Questions for this Poll which is stored in Participant Answers

