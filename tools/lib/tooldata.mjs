// Every build Volvo supplied, sorted by the tool it was made in.
//
// Two rules hold across all of it, both from him directly: plain words, no
// client names. A third is mine: nothing here is invented. Where a source sheet
// was unreadable or duplicated another, it is folded rather than padded out,
// and the fold is stated on the page.
//
// Zapier is deliberately absent. It is on his CV, no Zapier material exists in
// what was supplied, and a tool page with nothing real in it is worse than none.
//
// `flow` is the canvas that plays. `play` is the story a visitor is walked
// through, so for a build that retries it goes round the loop once - the retry
// is seen rather than described.

/* ══ n8n ═══════════════════════════════════════════════════════════════════ */
const N = {
  crm: {
    nodes: [{ id: "t", label: "A form is filled in", kind: "trigger" },
      { id: "e", label: "Tidy the answers" },
      { id: "c", label: "Create or update the contact", kind: "end" }],
    edges: [{ from: "t", to: "e" }, { from: "e", to: "c" }],
    play: ["t", "e", "c"],
    caption: { t: "Someone hits submit", e: "Answers into the right fields",
      c: "The contact exists. Nobody typed it." }
  },
  book: {
    nodes: [{ id: "t", label: "A form is filled in", kind: "trigger" },
      { id: "e", label: "Tidy the answers" }, { id: "c", label: "Create or update the contact" },
      { id: "f", label: "Find their record" }, { id: "b", label: "Book the appointment", kind: "decision" },
      { id: "ok", label: "Confirm it worked", kind: "end" }, { id: "no", label: "Say it failed", kind: "fail" }],
    edges: [{ from: "t", to: "e" }, { from: "e", to: "c" }, { from: "c", to: "f" },
      { from: "f", to: "b" }, { from: "b", to: "ok", label: "booked" },
      { from: "b", to: "no", label: "did not book" }],
    play: ["t", "e", "c", "f", "b", "ok"],
    caption: { b: "Two ways out, and they are not the same thing",
      no: "A failure reports as a failure, never as silence" }
  },
  video: {
    nodes: [{ id: "t", label: "A form is filled in", kind: "trigger" },
      { id: "v", label: "Read the answers" }, { id: "p", label: "Write the prompt" },
      { id: "g", label: "Ask for the video" }, { id: "w", label: "Wait", kind: "wait" },
      { id: "q", label: "Is it finished?", kind: "decision" }, { id: "d", label: "Download it" },
      { id: "s", label: "Save it to Drive", kind: "end" }],
    edges: [{ from: "t", to: "v" }, { from: "v", to: "p" }, { from: "p", to: "g" },
      { from: "g", to: "w" }, { from: "w", to: "q" },
      { from: "q", to: "w", label: "not yet", back: true },
      { from: "q", to: "d", label: "ready" }, { from: "d", to: "s" }],
    play: ["t", "v", "p", "g", "w", "q", "w", "q", "d", "s"],
    caption: { g: "The render starts. Minutes, not seconds.", w: "Waiting",
      q: "Asking whether it is done yet", s: "In the folder. Nobody watched it render." }
  },
  callback: {
    nodes: [{ id: "t", label: "A form is filled in", kind: "trigger" },
      { id: "r", label: "Write down the time" }, { id: "h", label: "Wait for opening hours", kind: "wait" },
      { id: "o", label: "Is it open yet?", kind: "decision" }, { id: "c", label: "Ring them", kind: "end" },
      { id: "x", label: "Has a day passed?", kind: "decision" },
      { id: "w", label: "Wait fifteen minutes", kind: "wait" },
      { id: "s", label: "Tell the team instead", kind: "fail" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "h" }, { from: "h", to: "o" },
      { from: "o", to: "c", label: "open" }, { from: "o", to: "x", label: "shut" },
      { from: "x", to: "s", label: "yes" }, { from: "x", to: "w", label: "no" },
      { from: "w", to: "o", back: true }],
    play: ["t", "r", "h", "o", "x", "w", "o", "c"],
    caption: { t: "It is ten at night", o: "Checking whether anyone is there",
      x: "Deciding whether to keep trying at all", c: "Nine in the morning. Now it rings." }
  },
  writeup: {
    nodes: [{ id: "t", label: "A call summary arrives", kind: "trigger" },
      { id: "f", label: "Only if it was analysed" }, { id: "l", label: "File the details" },
      { id: "q", label: "Everything collected?", kind: "decision" },
      { id: "s", label: "Tell the team", kind: "end" }, { id: "g", label: "Go back for the rest" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "l" }, { from: "l", to: "q" },
      { from: "q", to: "s", label: "yes" }, { from: "q", to: "g", label: "no" }],
    play: ["t", "f", "l", "q", "g"],
    caption: { q: "It does not assume the call went well", g: "Something is missing, so it fetches it" }
  },
  lookup: {
    nodes: [{ id: "t", label: "A call comes in", kind: "trigger" },
      { id: "s", label: "Look up the number" }, { id: "v", label: "Read off their details" },
      { id: "a", label: "Answer back", kind: "end" }],
    edges: [{ from: "t", to: "s" }, { from: "s", to: "v" }, { from: "v", to: "a" }],
    play: ["t", "s", "v", "a"],
    caption: { t: "The phone is still ringing", a: "Who is calling, before it connects" }
  },
  thursday: {
    nodes: [{ id: "t", label: "Every Thursday, 9am", kind: "trigger" },
      { id: "c", label: "Tidy the wording" }, { id: "r", label: "Pick a different version" },
      { id: "p", label: "Post it to the team", kind: "end" }],
    edges: [{ from: "t", to: "c" }, { from: "c", to: "r" }, { from: "r", to: "p" }],
    play: ["t", "c", "r", "p"],
    caption: { r: "Different words each week, so it keeps getting read", p: "Nobody had to remember" }
  },
  research: {
    nodes: [{ id: "t", label: "On a schedule", kind: "trigger" },
      { id: "c", label: "Collect videos" }, { id: "k", label: "Seen this before?", kind: "decision" },
      { id: "d", label: "Drop the repeats" }, { id: "n", label: "Download the new ones" },
      { id: "s", label: "Transcribe" }, { id: "w", label: "Work out what worked" },
      { id: "p", label: "Research around it" }, { id: "x", label: "Write a new script", kind: "end" }],
    edges: [{ from: "t", to: "c" }, { from: "c", to: "k" }, { from: "k", to: "d" },
      { from: "d", to: "n" }, { from: "n", to: "s" }, { from: "s", to: "w" },
      { from: "w", to: "p" }, { from: "p", to: "x" }],
    play: ["t", "c", "k", "d", "n", "s", "w", "p", "x"],
    caption: { k: "The step that saves the money", d: "Repeats gone before anything is paid for",
      x: "A fresh script, from what actually worked" }
  },
  list: {
    nodes: [{ id: "t", label: "Another build asks", kind: "trigger" },
      { id: "f", label: "Fetch the list" }, { id: "r", label: "Keep what matters" },
      { id: "d", label: "Drop duplicates" }, { id: "l", label: "Work through them", kind: "decision" },
      { id: "x", label: "Fetch the detail" }, { id: "g", label: "Gather it back up" },
      { id: "d2", label: "Drop duplicates again" }, { id: "s", label: "Write it to the sheet", kind: "end" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "r" }, { from: "r", to: "d" },
      { from: "d", to: "l" }, { from: "l", to: "x", label: "next one" },
      { from: "x", to: "l", back: true },
      { from: "l", to: "g", label: "all done" }, { from: "g", to: "d2" }, { from: "d2", to: "s" }],
    play: ["t", "f", "r", "d", "l", "x", "l", "g", "d2", "s"],
    caption: { l: "One at a time, until there are none left",
      d2: "Again, because fetching detail can introduce new ones", s: "Nothing counted twice" }
  }
};

/* ══ GoHighLevel ═══════════════════════════════════════════════════════════ */
const G = {
  purchase: {
    nodes: [{ id: "t", label: "An order is placed", kind: "trigger" },
      { id: "r", label: "They stop being a lead" }, { id: "a", label: "They become a customer" },
      { id: "o", label: "Move them down the pipeline" }, { id: "w", label: "Wait", kind: "wait" },
      { id: "e", label: "Send the confirmation", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "a" }, { from: "a", to: "o" },
      { from: "o", to: "w" }, { from: "w", to: "e" }],
    play: ["t", "r", "a", "o", "w", "e"],
    caption: { r: "The old label comes off before the new one goes on",
      w: "A beat, so the email does not beat the payment receipt",
      e: "Confirmed, without anyone opening the CRM" }
  },
  quote: {
    nodes: [{ id: "t", label: "A quote is requested", kind: "trigger" },
      { id: "m", label: "Hand it to the quote builder" }, { id: "g", label: "Label them" },
      { id: "c", label: "Create the contact" }, { id: "w", label: "Wait", kind: "wait" },
      { id: "e", label: "Send the quote", kind: "end" }],
    edges: [{ from: "t", to: "m" }, { from: "m", to: "g" }, { from: "g", to: "c" },
      { from: "c", to: "w" }, { from: "w", to: "e" }],
    play: ["t", "m", "g", "c", "w", "e"],
    caption: { m: "The numbers are worked out elsewhere and handed back",
      e: "A quote in their inbox in minutes, not tomorrow" }
  },
  nurture: {
    nodes: [{ id: "t", label: "A form is filled in", kind: "trigger" },
      { id: "g", label: "Label them" }, { id: "p", label: "Put them in the pipeline" },
      { id: "e1", label: "Email one: hello" }, { id: "w", label: "Wait", kind: "wait" },
      { id: "e2", label: "Emails two to five" }, { id: "e6", label: "Email six: the objections", kind: "end" }],
    edges: [{ from: "t", to: "g" }, { from: "g", to: "p" }, { from: "p", to: "e1" },
      { from: "e1", to: "w" }, { from: "w", to: "e2" }, { from: "e2", to: "e6" }],
    play: ["t", "g", "p", "e1", "w", "e2", "e6"],
    caption: { w: "Days apart, not minutes", e6: "Then it stops. A sequence that never ends is spam." }
  },
  booked: {
    nodes: [{ id: "t", label: "They book a call", kind: "trigger" },
      { id: "g", label: "Label the booking" }, { id: "o", label: "Move them down the pipeline" },
      { id: "x", label: "Take them out of the chase", kind: "decision" },
      { id: "c", label: "Confirm it" }, { id: "r3", label: "Three days before" },
      { id: "r2", label: "Two days before" }, { id: "r1", label: "The day before", kind: "end" }],
    edges: [{ from: "t", to: "g" }, { from: "g", to: "o" }, { from: "o", to: "x" },
      { from: "x", to: "c" }, { from: "c", to: "r3" }, { from: "r3", to: "r2" }, { from: "r2", to: "r1" }],
    play: ["t", "g", "o", "x", "c", "r3", "r2", "r1"],
    caption: { x: "The most important step: stop chasing someone who already said yes",
      r1: "Four reminders, none of them sent by a person" }
  },
  fb: {
    nodes: [{ id: "t", label: "Someone comments", kind: "trigger" },
      { id: "w", label: "Wait a moment", kind: "wait" }, { id: "r", label: "Reply in public" },
      { id: "w2", label: "Wait again", kind: "wait" }, { id: "m", label: "Message them privately", kind: "decision" },
      { id: "y", label: "They ask for the link", kind: "end" }, { id: "n", label: "Nothing more", kind: "fail" }],
    edges: [{ from: "t", to: "w" }, { from: "w", to: "r" }, { from: "r", to: "w2" },
      { from: "w2", to: "m" }, { from: "m", to: "y", label: "they reply" },
      { from: "m", to: "n", label: "silence" }],
    play: ["t", "w", "r", "w2", "m", "y"],
    caption: { w: "A pause, so it does not read as a bot",
      r: "Answered where everyone can see it", m: "Then privately, where the conversation can go",
      n: "Silence is allowed to be the end of it" }
  },
  ig: {
    nodes: [{ id: "t", label: "Someone comments", kind: "trigger" },
      { id: "d", label: "Comment or message?", kind: "decision" },
      { id: "c", label: "Answer the comment" }, { id: "m", label: "Answer the message" },
      { id: "o", label: "Offer them a place", kind: "decision" },
      { id: "y", label: "Count them in", kind: "end" }, { id: "n", label: "Leave it there", kind: "fail" }],
    edges: [{ from: "t", to: "d" }, { from: "d", to: "c", label: "comment" },
      { from: "d", to: "m", label: "message" }, { from: "c", to: "o" }, { from: "m", to: "o" },
      { from: "o", to: "y", label: "yes" }, { from: "o", to: "n", label: "not for me" }],
    play: ["t", "d", "c", "o", "y"],
    caption: { d: "The same question can arrive two ways, and they are answered differently",
      n: "A no is a real answer, and it is taken" }
  },
  speed: {
    nodes: [{ id: "t", label: "A new lead lands", kind: "trigger" },
      { id: "c1", label: "Opening message" }, { id: "r", label: "Do they reply?", kind: "decision" },
      { id: "c2", label: "Conversations two to five" },
      { id: "q", label: "Qualified?", kind: "decision" },
      { id: "h", label: "Hand to a human", kind: "end" },
      { id: "s", label: "Stop, quietly", kind: "fail" }],
    edges: [{ from: "t", to: "c1" }, { from: "c1", to: "r" },
      { from: "r", to: "c2", label: "yes" }, { from: "r", to: "s", label: "no reply" },
      { from: "c2", to: "q" }, { from: "q", to: "h", label: "yes" }, { from: "q", to: "s", label: "no" }],
    play: ["t", "c1", "r", "c2", "q", "h"],
    caption: { c1: "Within moments of the lead arriving",
      c2: "Five stages, each one a separate build",
      h: "It never closes. It hands over." }
  },
  defib: {
    nodes: [{ id: "t", label: "An old lead is picked", kind: "trigger" },
      { id: "c1", label: "Opening message" }, { id: "r", label: "Any answer?", kind: "decision" },
      { id: "c2", label: "Conversations two to five" },
      { id: "l", label: "Send the calendar link", kind: "decision" },
      { id: "n", label: "Tell you they qualified", kind: "end" },
      { id: "s", label: "Let them be", kind: "fail" }],
    edges: [{ from: "t", to: "c1" }, { from: "c1", to: "r" },
      { from: "r", to: "c2", label: "yes" }, { from: "r", to: "s", label: "nothing" },
      { from: "c2", to: "l" }, { from: "l", to: "n", label: "they qualify" },
      { from: "l", to: "s", label: "they do not" }],
    play: ["t", "c1", "r", "c2", "l", "n"],
    caption: { t: "Someone who went cold months ago",
      l: "The link only goes to people who actually qualify",
      n: "You hear about it once it is worth hearing about" }
  },
  quit: {
    nodes: [{ id: "t", label: "They reply: quit", kind: "trigger" },
      { id: "d", label: "Stop all messages" }, { id: "r1", label: "Out of stage one" },
      { id: "r2", label: "Out of stages two to four" }, { id: "r5", label: "Out of stage five", kind: "end" }],
    edges: [{ from: "t", to: "d" }, { from: "d", to: "r1" }, { from: "r1", to: "r2" }, { from: "r2", to: "r5" }],
    play: ["t", "d", "r1", "r2", "r5"],
    caption: { t: "Quit, QUIT or quit - three separate triggers, because nobody checks their capitals",
      d: "Everything stops before anything else happens",
      r5: "Nothing left running. This exists twice, once per system." }
  },
  qualify: {
    nodes: [{ id: "t", label: "Their record changes", kind: "trigger" },
      { id: "q", label: "Do they qualify?", kind: "decision" },
      { id: "g", label: "Label them" }, { id: "f", label: "Note what they want" },
      { id: "o", label: "Move them down the pipeline" },
      { id: "n", label: "Tell you", kind: "end" }, { id: "x", label: "Say nothing", kind: "fail" }],
    edges: [{ from: "t", to: "q" }, { from: "q", to: "g", label: "yes" },
      { from: "q", to: "x", label: "no" }, { from: "g", to: "f" }, { from: "f", to: "o" }, { from: "o", to: "n" }],
    play: ["t", "q", "g", "f", "o", "n"],
    caption: { q: "The gate. Everything after it is worth your attention.",
      x: "No notification is the correct outcome most of the time",
      n: "You are only interrupted when it means something" }
  },
  emailcall: {
    nodes: [{ id: "t", label: "A campaign starts", kind: "trigger" },
      { id: "e", label: "Emails go out" }, { id: "o", label: "Did they open it?", kind: "decision" },
      { id: "c", label: "Queue a call", kind: "end" }, { id: "r", label: "Keep emailing" }],
    edges: [{ from: "t", to: "e" }, { from: "e", to: "o" },
      { from: "o", to: "c", label: "engaged" }, { from: "o", to: "r", label: "not yet" }],
    play: ["t", "e", "o", "c"],
    caption: { o: "Interest decides who gets a human", c: "A call, only to people who showed up" }
  }
};

/* ══ Make.com ══════════════════════════════════════════════════════════════ */
const M = {
  magnet: {
    nodes: [{ id: "t", label: "A form is answered", kind: "trigger" },
      { id: "r", label: "Read the answers" }, { id: "g", label: "Write their version" },
      { id: "b", label: "Build the document" }, { id: "l", label: "Get a shareable link" },
      { id: "e", label: "Email it to them", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "g" }, { from: "g", to: "b" },
      { from: "b", to: "l" }, { from: "l", to: "e" }],
    play: ["t", "r", "g", "b", "l", "e"],
    caption: { g: "Their answers, not a template with their name on it",
      e: "A document made for them, while they are still on the page" }
  },
  twoways: {
    nodes: [{ id: "t", label: "A form is answered", kind: "trigger" },
      { id: "d", label: "Did they pay?", kind: "decision" },
      { id: "p", label: "Send them onward" }, { id: "s", label: "Find or make the record" },
      { id: "n", label: "Nudge them", kind: "end" }, { id: "x", label: "Label and wait", kind: "end" }],
    edges: [{ from: "t", to: "d" }, { from: "d", to: "p", label: "paid" },
      { from: "d", to: "s", label: "just replied" }, { from: "p", to: "n" }, { from: "s", to: "x" }],
    play: ["t", "d", "p", "n"],
    caption: { d: "One form, two completely different follow-ups",
      x: "Someone who only answered is not chased like someone who bought" }
  },
  signed: {
    nodes: [{ id: "t", label: "A form is answered", kind: "trigger" },
      { id: "c", label: "Draw up the document" }, { id: "d", label: "Fetch the finished copy" },
      { id: "u", label: "File it" }, { id: "s", label: "Log it on the sheet", kind: "end" }],
    edges: [{ from: "t", to: "c" }, { from: "c", to: "d" }, { from: "d", to: "u" }, { from: "u", to: "s" }],
    play: ["t", "c", "d", "u", "s"],
    caption: { u: "Filed where the team already looks", s: "And written down, so it can be found later" }
  },
  twodocs: {
    nodes: [{ id: "t", label: "A form is answered", kind: "trigger" },
      { id: "f", label: "Pull the template" }, { id: "b", label: "Fill it in" },
      { id: "s", label: "Save both copies" }, { id: "d", label: "Who gets which?", kind: "decision" },
      { id: "e1", label: "One goes to them" }, { id: "e2", label: "One goes to the office", kind: "end" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "b" }, { from: "b", to: "s" },
      { from: "s", to: "d" }, { from: "d", to: "e1" }, { from: "d", to: "e2" }],
    play: ["t", "f", "b", "s", "d", "e2"],
    caption: { d: "The customer's copy and the internal copy are not the same document" }
  },
  writeboth: {
    nodes: [{ id: "t", label: "Something calls in", kind: "trigger" },
      { id: "s", label: "Write the text message" }, { id: "e", label: "Write the email" },
      { id: "g", label: "Send it", kind: "end" }],
    edges: [{ from: "t", to: "s" }, { from: "s", to: "e" }, { from: "e", to: "g" }],
    play: ["t", "s", "e", "g"],
    caption: { s: "Short, for a phone", e: "Longer, for an inbox. Same facts, different shape." }
  },
  bookingchange: {
    nodes: [{ id: "t", label: "A booking changes", kind: "trigger" },
      { id: "v", label: "Work out whose" }, { id: "d", label: "Which change?", kind: "decision" },
      { id: "c", label: "Cancelled" }, { id: "s", label: "Started" },
      { id: "r", label: "Moved" }, { id: "n", label: "Write it on the record", kind: "end" }],
    edges: [{ from: "t", to: "v" }, { from: "v", to: "d" },
      { from: "d", to: "c", label: "cancelled" }, { from: "d", to: "s", label: "started" },
      { from: "d", to: "r", label: "rescheduled" },
      { from: "c", to: "n" }, { from: "s", to: "n" }, { from: "r", to: "n" }],
    play: ["t", "v", "d", "r", "n"],
    caption: { d: "Three things can happen and they are not interchangeable",
      n: "Whatever happened, the record says so" }
  },
  clock: {
    nodes: [{ id: "t", label: "The agent asks", kind: "trigger" },
      { id: "n", label: "Get the time now" }, { id: "f", label: "Put it in their timezone" },
      { id: "r", label: "Answer", kind: "end" }],
    edges: [{ from: "t", to: "n" }, { from: "n", to: "f" }, { from: "f", to: "r" }],
    play: ["t", "n", "f", "r"],
    caption: { t: "A voice agent has no clock of its own",
      f: "Their timezone, not the server's", r: "So it never offers a slot in the past" }
  },
  mailer: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "r", label: "Read the sheet" }, { id: "v", label: "Fill in the blanks" },
      { id: "w", label: "Pause between sends", kind: "wait" }, { id: "g", label: "Send it", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "v" }, { from: "v", to: "w" }, { from: "w", to: "g" }],
    play: ["t", "r", "v", "w", "g"],
    caption: { w: "Spaced out on purpose, so it does not look like a blast",
      g: "Sent, by nobody" }
  },
  pin: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "r", label: "Find the next image" }, { id: "l", label: "Look at the picture" },
      { id: "w", label: "Write the caption" }, { id: "u", label: "Mark it as used" },
      { id: "p", label: "Post it", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "l" }, { from: "l", to: "w" },
      { from: "w", to: "u" }, { from: "u", to: "p" }],
    play: ["t", "r", "l", "w", "u", "p"],
    caption: { l: "It actually looks at the image before describing it",
      u: "Marked used first, so a crash never posts it twice" }
  },
  insta: {
    nodes: [{ id: "t", label: "Every morning", kind: "trigger" },
      { id: "r", label: "Find the next image" }, { id: "l", label: "Look at the picture" },
      { id: "u", label: "Mark it as used" }, { id: "w", label: "Pause", kind: "wait" },
      { id: "p", label: "Post it", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "l" }, { from: "l", to: "u" },
      { from: "u", to: "w" }, { from: "w", to: "p" }],
    play: ["t", "r", "l", "u", "w", "p"],
    caption: { t: "Once a day, at the same time", p: "One post, every day, without a person" }
  },
  news: {
    nodes: [{ id: "t", label: "New article appears", kind: "trigger" },
      { id: "g", label: "Draft a take on it" }, { id: "d", label: "Post or park?", kind: "decision" },
      { id: "l", label: "Post it", kind: "end" }, { id: "o", label: "Save it to write later" }],
    edges: [{ from: "t", to: "g" }, { from: "g", to: "d" },
      { from: "d", to: "l", label: "good enough" }, { from: "d", to: "o", label: "needs a person" }],
    play: ["t", "g", "d", "o"],
    caption: { d: "Not everything drafted is worth posting",
      o: "The drafts nobody posts still get kept" }
  },
  newname: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "r", label: "Read the sheet" }, { id: "s", label: "Do we know them?", kind: "decision" },
      { id: "a", label: "Add a note to their record" }, { id: "n", label: "Create the record" },
      { id: "k", label: "Tell the team", kind: "end" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "s" },
      { from: "s", to: "a", label: "we do" }, { from: "s", to: "n", label: "new" }, { from: "n", to: "k" }],
    play: ["t", "r", "s", "n", "k"],
    caption: { s: "An existing name is not treated as a new lead",
      k: "The team hears about the new ones only" }
  },
  phones: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "f", label: "Fetch the records" }, { id: "i", label: "One at a time", kind: "decision" },
      { id: "p", label: "Tidy the number" }, { id: "s", label: "Write it down", kind: "end" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "i" },
      { from: "i", to: "p", label: "next" }, { from: "p", to: "i", back: true },
      { from: "i", to: "s", label: "done" }],
    play: ["t", "f", "i", "p", "i", "s"],
    caption: { p: "Every number ends up in the same shape",
      s: "A list you can actually dial from" }
  },
  folders: {
    nodes: [{ id: "t", label: "Every afternoon", kind: "trigger" },
      { id: "r", label: "Read the product list" }, { id: "l", label: "Does it have a folder?", kind: "decision" },
      { id: "c", label: "Make one", kind: "end" }, { id: "s", label: "Leave it alone", kind: "fail" }],
    edges: [{ from: "t", to: "r" }, { from: "r", to: "l" },
      { from: "l", to: "c", label: "no" }, { from: "l", to: "s", label: "already there" }],
    play: ["t", "r", "l", "c"],
    caption: { l: "It checks first, so it never makes a second one",
      s: "Doing nothing is the common case, and it is fine" }
  },
  adscore: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "f", label: "Find copy to review" }, { id: "a", label: "Read it" },
      { id: "j", label: "Turn it into fields" }, { id: "u", label: "Write the verdict back", kind: "end" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "a" }, { from: "a", to: "j" }, { from: "j", to: "u" }],
    play: ["t", "f", "a", "j", "u"],
    caption: { j: "Prose turned into columns, so it can be sorted",
      u: "Back in the same row it came from" }
  },
  translate: {
    nodes: [{ id: "t", label: "Someone asks", kind: "trigger" },
      { id: "f", label: "Find the copy" }, { id: "e", label: "Into English" },
      { id: "g", label: "Into German" }, { id: "r", label: "Into French" },
      { id: "s", label: "Write all three back", kind: "end" }],
    edges: [{ from: "t", to: "f" }, { from: "f", to: "e" }, { from: "e", to: "g" },
      { from: "g", to: "r" }, { from: "r", to: "s" }],
    play: ["t", "f", "e", "g", "r", "s"],
    caption: { s: "Three markets from one piece of copy, each in its own column" }
  },
  thursday: {
    nodes: [{ id: "t", label: "Every Thursday", kind: "trigger" },
      { id: "l", label: "Load the reminders" }, { id: "j", label: "Pick the pieces" },
      { id: "r", label: "Shuffle the wording" }, { id: "s", label: "Post it", kind: "end" }],
    edges: [{ from: "t", to: "l" }, { from: "l", to: "j" }, { from: "j", to: "r" }, { from: "r", to: "s" }],
    play: ["t", "l", "j", "r", "s"],
    caption: { r: "Same message, different words, so it keeps being read" }
  },
  offices: {
    nodes: [{ id: "t", label: "The collector runs", kind: "trigger" },
      { id: "w", label: "Wait for it to finish", kind: "wait" }, { id: "g", label: "Take the results" },
      { id: "d", label: "Already on file?", kind: "decision" },
      { id: "c", label: "Add them", kind: "end" }, { id: "s", label: "Skip", kind: "fail" }],
    edges: [{ from: "t", to: "w" }, { from: "w", to: "g" }, { from: "g", to: "d" },
      { from: "d", to: "c", label: "new" }, { from: "d", to: "s", label: "known" }],
    play: ["t", "w", "g", "d", "c"],
    caption: { w: "Collecting takes time, so it waits rather than guessing",
      d: "The same office is never added twice" }
  },
  outbound: {
    nodes: [{ id: "t", label: "Every fifteen minutes", kind: "trigger" },
      { id: "s", label: "Find who to call" }, { id: "d", label: "Called already?", kind: "decision" },
      { id: "a", label: "Add them" }, { id: "c", label: "Check the diary" },
      { id: "v", label: "Hand over the details" }, { id: "k", label: "Place the call", kind: "end" }],
    edges: [{ from: "t", to: "s" }, { from: "s", to: "d" },
      { from: "d", to: "a", label: "no" }, { from: "a", to: "c" }, { from: "c", to: "v" }, { from: "v", to: "k" }],
    play: ["t", "s", "d", "a", "c", "v", "k"],
    caption: { d: "Nobody gets rung twice",
      c: "It reads the real diary first, so it can offer a slot that exists",
      k: "The agent dials knowing who it is calling and when they are free" }
  }
};

export const TOOLS = [
  {
    key: "ghl", file: "ghl.html", name: "GoHighLevel", logo: "gohighlevel.png",
    tagline: "Follow-up that runs on its own.",
    badge: "11 systems", count: 11, countNote: "systems",
    bullets: ["Leads move without anyone pushing", "Nobody is chased after they say yes", "Every conversation has an exit"],
    blurb: `The CRM is where the follow-up lives. These are the builds that decide who gets
      messaged, who gets left alone, and who is worth interrupting you for.`,
    foot: `Two of these - the conversation engines - are five workflows each plus their own
      exit. They are shown as one system rather than twelve rows, because that is what they are.`,
    groups: [
      { key: "form", label: "When someone fills in a form",
        blurb: "The moment somebody asks for something, the record is already right.",
        items: [
          { name: "A purchase turns a lead into a customer", flow: G.purchase,
            purpose: "An order comes in. The old label comes off, the new one goes on, the deal moves down the pipeline, and the confirmation goes out.",
            note: "The lead label is removed BEFORE the customer label is added. Left on, a paying customer keeps getting the emails meant for people who have not bought." },
          { name: "A form becomes a quote", flow: G.quote,
            purpose: "Someone asks for a price. The numbers are worked out elsewhere and handed back, the contact is created, and the quote is emailed.",
            note: "The quote is built by a separate system and handed back. One job per tool, so neither becomes the thing nobody can safely change." },
          { name: "Six emails, spaced out, then it stops", flow: G.nurture,
            purpose: "A new contact gets six emails days apart: hello, the story, the useful one, the offer, the proof, the objections.",
            note: "It ends. A sequence with no end is not nurture, it is spam with a schedule." }
        ] },
      { key: "book", label: "When a call is booked",
        blurb: "Booked is a different state from interested, and it is treated as one.",
        items: [
          { name: "Booked, then reminded four times", flow: G.booked,
            purpose: "A confirmed booking is labelled, moved down the pipeline, and reminded at three days, two days, the day before and on the day.",
            note: "The step that matters is the fourth one: it takes them OUT of the chase. Without it the person who just booked keeps receiving messages asking them to book." }
        ] },
      { key: "social", label: "When someone comments",
        blurb: "A public comment answered in public, then continued in private.",
        items: [
          { name: "A comment becomes a conversation", flow: G.fb,
            purpose: "Someone comments on a post. It waits, replies publicly, waits again, then opens a private message with a way to go further.",
            note: "It pauses before replying. An instant answer to a comment reads as a robot, and the pause costs nothing." },
          { name: "The same question, asked two ways", flow: G.ig,
            purpose: "A comment and a direct message are the same intent arriving differently, so they get different handling and end in the same place.",
            note: "One of the endings is simply 'not for me', and it is taken at face value rather than answered with another offer." }
        ] },
      { key: "convo", label: "The conversation engines",
        blurb: "Two systems that hold a real back-and-forth by text. Five stages each, and an exit each.",
        items: [
          { name: "Speed to Lead: answer before they cool", flow: G.speed,
            purpose: "A brand new lead gets a message within moments, then up to five stages of conversation, and a human takes over the second it is worth a human.",
            note: "It never tries to close. Its whole job is to reach a person who is still interested and hand them over warm." },
          { name: "Waking up leads everyone gave up on", flow: G.defib,
            purpose: "Old leads nobody has time to call twice get re-opened by text, qualified over five stages, and only then handed a calendar link.",
            note: "The calendar link is gated. Sending it to everyone turns a booking page into a spam complaint." },
          { name: "One word, and everything stops", flow: G.quit,
            purpose: "The customer replies quit. Messages stop, and they are removed from all five stages at once.",
            note: "Three separate triggers watch for Quit, QUIT and quit, because a person who wants out will not check their capital letters first. This ships with BOTH engines.",
            deep: { file: "the-way-out.html", label: "Type the word, watch five conversations switch off" } }
        ] },
      { key: "gate", label: "When to interrupt a human",
        blurb: "Most automation shouts. These decide when not to.",
        items: [
          { name: "Only tell me when they actually qualify", flow: G.qualify,
            purpose: "A record changes. If the person genuinely qualifies they are labelled, their intent is noted, the deal moves, and you are told. Otherwise nothing happens.",
            note: "Silence is the correct outcome most of the time. A notification for every change is a notification nobody reads." },
          { name: "An email campaign that ends in a phone call", flow: G.emailcall,
            purpose: "Emails go out, and the people who engage are queued for a call rather than another email.",
            note: "Interest decides who gets a human, so nobody spends the day ringing people who never opened anything." }
        ] }
    ]
  },

  {
    key: "make", file: "make.html", name: "Make.com", logo: "make.svg",
    tagline: "The wiring between everything else.",
    badge: "19 scenarios", count: 19, countNote: "scenarios",
    bullets: ["Tools that do not talk, made to", "Nothing is done twice", "It posts, files and writes while you sleep"],
    blurb: `Make is where the tools that were never designed to work together are made to.
      A form here, a document there, a record somewhere else - joined up.`,
    foot: `Read from the supplied scenario files. Two of them appeared in both sets and are
      counted once.`,
    groups: [
      { key: "form", label: "When a form is answered",
        blurb: "The answer does more than land in an inbox.",
        items: [
          { name: "Their answers become a document, emailed back", flow: M.magnet,
            purpose: "Someone fills in a form. What they wrote is turned into a document made for them, and it is in their inbox while they are still on the page.",
            note: "It is built from their answers, not a template with their name dropped in." },
          { name: "One form, two very different follow-ups", flow: M.twoways,
            purpose: "The same form is answered by people who paid and people who only replied, and each is treated differently from that moment on.",
            note: "Someone who only answered is not chased like someone who bought." },
          { name: "A form becomes a signed document, filed", flow: M.signed,
            purpose: "An answer draws up the document, fetches the finished copy, files it where the team already looks, and logs it.",
            note: "Filed AND logged. A document nobody can find later was not really filed." },
          { name: "Two documents, two recipients", flow: M.twodocs,
            purpose: "One answer fills a template twice: the customer's copy and the internal copy, each sent to the right place.",
            note: "They are not the same document, and treating them as one is how the wrong version reaches a customer." }
        ] },
      { key: "call", label: "When another system calls in",
        blurb: "Something finishes elsewhere and this picks it up.",
        items: [
          { name: "Write the text and the email, then send", flow: M.writeboth,
            purpose: "One event produces both a short message for a phone and a longer one for an inbox, then sends it.",
            note: "Same facts, different shape. A text that reads like an email gets deleted." },
          { name: "A booking changes, and the record keeps up", flow: M.bookingchange,
            purpose: "Cancelled, started or moved - three different things, each written onto the person's record properly.",
            note: "Three outcomes, three paths. Collapsing them loses the reason the record changed." },
          { name: "Tell the voice agent what time it is", flow: M.clock,
            purpose: "A voice agent has no clock of its own. This answers with the current time in the caller's timezone.",
            note: "Without it an agent will cheerfully offer an appointment slot that has already passed." }
        ] },
      { key: "clock", label: "On a clock",
        blurb: "Running whether anyone is at a desk or not.",
        items: [
          { name: "The email that goes out without anyone sending it", flow: M.mailer,
            purpose: "Reads the next row, fills in the blanks, pauses, and sends.",
            note: "The pause is deliberate. Sent all at once it looks like a blast, and gets treated like one." },
          { name: "Look at the picture, write the caption, post it", flow: M.pin,
            purpose: "Finds the next image, actually looks at it, writes a caption from what is in it, marks it used, and posts.",
            note: "It marks the image used BEFORE posting. Crash after posting and you have a duplicate; crash after marking and you have a gap, which is the cheaper mistake." },
          { name: "One post a day, without a person", flow: M.insta,
            purpose: "The same idea on a daily clock for a different platform.",
            note: "Once a day at a fixed time, so the account looks tended rather than automated." },
          { name: "Read the news, draft the post", flow: M.news,
            purpose: "New articles get a draft written about them, and only the good ones go out. The rest are kept to finish later.",
            note: "Not everything drafted is worth posting, and the ones that are not still get kept." },
          { name: "New name or old name, and the team is told", flow: M.newname,
            purpose: "Checks each row against the records, adds a note to people already known, creates the ones who are not, and announces only the new ones.",
            note: "An existing customer arriving again is not a new lead, and announcing them as one costs the team's trust in the alerts." },
          { name: "Clean up a list of phone numbers", flow: M.phones,
            purpose: "Fetches records, works through them one at a time, puts every number into the same shape, and writes them down.",
            note: "One shape means a list you can dial from rather than one somebody has to fix first." },
          { name: "Every product gets its folder", flow: M.folders,
            purpose: "Runs each afternoon, checks whether each product already has a folder, and creates only the missing ones.",
            note: "Doing nothing is the usual outcome, and that is the point of checking first." },
          { name: "Read the ad copy and score it", flow: M.adscore,
            purpose: "Finds copy waiting for review, reads it, turns the verdict into columns, and writes it back to the same row.",
            note: "Prose into columns, so a hundred pieces can be sorted instead of read." },
          { name: "Ad copy in three languages", flow: M.translate,
            purpose: "One piece of copy translated into English, German and French, each written back into its own column.",
            note: "Three markets from one write-up, with the original kept beside them." },
          { name: "The Thursday reminder, worded differently", flow: M.thursday,
            purpose: "Loads the reminders, shuffles the wording, and posts it to the team every Thursday.",
            note: "The shuffle is the point. The same words every week stop being read by about the fourth one." },
          { name: "Collect offices, skip the ones on file", flow: M.offices,
            purpose: "Runs a collector, waits for it to finish, takes the results, and adds only the ones not already recorded.",
            note: "It waits rather than guessing how long collecting takes, and it never adds the same office twice." },
          { name: "Line up the call, then place it", flow: M.outbound,
            purpose: "Finds who to call, checks nobody is rung twice, reads the real diary for free slots, hands the details over, and places the call.",
            note: "It reads the actual diary first, so the agent can offer a time that genuinely exists." }
        ] }
    ]
  },

  {
    key: "n8n", file: "n8n.html", name: "n8n", logo: "n8n.svg",
    tagline: "The jobs that have to wait, retry or loop.",
    badge: "9 builds", count: 9, countNote: "builds",
    bullets: ["Waits for a render to finish", "Never calls at three in the morning", "Fetches a long list without repeats"],
    blurb: `n8n is where work goes when it cannot be done in one pass: a video that takes
      minutes to render, a call that must wait for opening hours, a list too long to fetch in one go.`,
    foot: `Read from the supplied build files. Client names are withheld throughout.`,
    groups: [
      { key: "form", label: "When a form is filled in",
        blurb: "Somebody submits something, and the work happens before anyone has opened a tab.",
        items: [
          { name: "Send a new lead straight into the CRM", flow: N.crm,
            purpose: "A form posts here, the answers are tidied into the right fields, and the contact is created or updated. Nobody retypes anything." },
          { name: "Create the contact and book the slot", flow: N.book,
            purpose: "The same thing, and then it books the appointment as well, reporting success and failure down two separate paths.",
            note: "Most builds treat an error as nothing happening. This one answers differently depending on which it was." },
          { name: "Turn a written answer into a finished video", flow: N.video,
            purpose: "Someone describes what they want. It is rewritten as a prompt, sent to a generator, and the finished file lands in a folder.",
            note: "A video takes minutes. So it waits, asks whether the render is done, and goes back to waiting - for as long as it takes, with nobody watching." },
          { name: "Call them back, but never at three in the morning", flow: N.callback,
            purpose: "A form comes in at any hour. The time is recorded, and the call only goes out once the office is open.",
            note: "If it is shut it waits fifteen minutes and checks again. If a whole day passes it stops and tells a human rather than looping forever." }
        ] },
      { key: "call", label: "When another system calls in",
        blurb: "Something finishes somewhere else and hands over what it learned.",
        items: [
          { name: "Write up the call, then chase what is missing", flow: N.writeup,
            purpose: "After a call ends this collects the summary, files it, and checks whether everything needed was captured.",
            note: "It does not assume the call went well. A missing detail is fetched rather than filed as complete." },
          { name: "Say who is calling, before the call connects", flow: N.lookup,
            purpose: "A number rings in. This looks it up and answers with who they are, fast enough to be useful while the phone is still ringing." }
        ] },
      { key: "sched", label: "On a clock",
        blurb: "Nobody has to remember.",
        items: [
          { name: "The Thursday reminder nobody has to remember", flow: N.thursday,
            purpose: "Every Thursday morning a reminder goes to the team, worded differently each week so people keep reading it.",
            note: "A reminder that arrives in the same words every week stops being read by about the fourth one." },
          { name: "Find a video, watch it, write a new script from it", flow: N.research,
            purpose: "Collects videos, skips any already seen, transcribes them, works out what made them work, researches around it, and drafts a script.",
            note: "The third step is the one that matters: it checks what it has already seen, so nothing is paid for twice." }
        ] },
      { key: "called", label: "When another build asks for it",
        blurb: "Work other builds reuse, rather than each repeating it.",
        items: [
          { name: "Collect a long list without collecting anything twice", flow: N.list,
            purpose: "Fetches a long list a page at a time, throws away duplicates, works through the rest, and writes the result to a sheet.",
            note: "Duplicates are removed twice, before and after the detail is fetched, because the second fetch introduces repeats the first pass could not see." }
        ] }
    ]
  }
];

/* The three single-build tools already have their own deep pages, built by
   tools/explainers.mjs. They appear on the index as cards like the rest. */
export const DEEP = [
  { key: "retell", file: "retell-agent.html", name: "Retell AI", logo: "retell.png",
    tagline: "An AI that phones people for you.",
    badge: "10 stops, 13 notes",
    bullets: ["No two calls take the same route", "It writes down what it learns", "It hands over, it never closes"] },
  { key: "intercom", file: "website-chat.html", name: "Intercom", logo: "intercom.svg",
    tagline: "The chat that books without a person.",
    badge: "144 chats, 11 booked",
    bullets: ["Four ways in, eight packages", "Answers from the company's own words", "Real numbers, including the plain ones"] },
  { key: "openphone", file: "call-routing.html", name: "OpenPhone", note: "now Quo", logo: "quo.png",
    tagline: "What happens when the phone rings.",
    badge: "Open and shut",
    bullets: ["Everyone rings at once, for fifteen seconds", "After hours it answers instantly", "It takes a message, it never sells"] }
];
