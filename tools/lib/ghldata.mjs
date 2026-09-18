// The eleven GoHighLevel systems, in the shape the Retell page uses.
//
// Volvo: "restructure ghl workflows same like retell". The Retell page is three
// things together - a map you walk, a panel that answers when you tap a stop,
// and a panel listing everything the build writes down, which lights up to show
// what THIS stop touched. The third panel is the one that makes it worth
// walking: it turns a diagram into a record of consequences.
//
// For a voice agent that third panel is the notes it takes. For a CRM it is the
// CONTACT RECORD, because that is the only thing these builds actually change.
// Every step below says which labels it puts on or takes off, where it moves
// the deal, what it writes into a field and what it sends. A step that touches
// nothing says so, and that is often the point.
//
// The canvas stays HORIZONTAL - he asked for that specifically - and the play
// button stays, driving the same panels. Walking it yourself and watching it
// walk are the same journey now, which they were not before.
//
// Plain words throughout, no client names, and nothing here is invented: every
// chain is read off the build files he supplied.

/* Everything the eleven builds can write on a contact, in the order a person
   would look for them. Each build names the subset it touches. */
export const RECORD = {
  lead: "Labelled: new lead",
  customer: "Labelled: customer",
  booked: "Labelled: booked a call",
  quoted: "Labelled: sent a quote",
  qualified: "Labelled: qualified",
  optout: "Labelled: asked to stop",
  stage: "Moved down the pipeline",
  removed: "Taken out of the chase",
  want: "What they asked for",
  when: "When they want it",
  source: "Where they came from",
  email: "Email sent",
  sms: "Text sent",
  reply: "Their reply, kept",
  notify: "Your team told",
  nothing: "Nothing written"
};

const S = (label, kind, says, writes = [], quote = null) => ({ label, kind, says, writes, quote });

/* NOTE there is no hand-written record list per build any more. renderWalk
   derives it from what the steps actually write, so the panel and the steps
   cannot disagree. */
export const GHL = {
  purchase: {
    nodes: {
      t: S("An order is placed", "trigger",
        "The payment is what starts it. Nobody opens the CRM and nobody remembers to.", ["source"]),
      r: S("They stop being a lead", null,
        "The lead label comes off first. This is the step everyone forgets, and it is the one that stops a paying customer receiving the emails written for people who have not bought.", ["lead"]),
      a: S("They become a customer", null,
        "Now the new label goes on. Order matters: off, then on, so there is never a moment where they are both.", ["customer"]),
      o: S("Move them down the pipeline", null,
        "The deal moves to the stage that means money has changed hands, so your board tells the truth without anyone dragging a card.", ["stage"]),
      w: S("Wait", "wait",
        "A deliberate pause, so your confirmation does not arrive before the payment receipt and read as a mistake.", []),
      e: S("Send the confirmation", "end",
        "Confirmed, in their inbox, while they are still on the thank-you page.", ["email"])
    },
    edges: [["t", "r"], ["r", "a"], ["a", "o"], ["o", "w"], ["w", "e"]]
  },

  quote: {
    nodes: {
      t: S("A quote is requested", "trigger",
        "Someone asks what it costs. That question has a short shelf life.", ["source", "want"]),
      m: S("Hand it to the quote builder", null,
        "The numbers are worked out by a separate system and handed back. One job per tool, so neither becomes the thing nobody dares change.", []),
      g: S("Label them", null,
        "Labelled as quoted, so every later build knows where this person is without asking.", ["quoted"]),
      c: S("Create the contact", null,
        "The record is created from what they typed. Nobody retypes it, so nobody mistypes it.", ["want"]),
      w: S("Wait", "wait", "A short pause, so it reads as considered rather than automatic.", []),
      e: S("Send the quote", "end",
        "A price in their inbox in minutes rather than tomorrow, which is usually the whole difference.", ["email"])
    },
    edges: [["t", "m"], ["m", "g"], ["g", "c"], ["c", "w"], ["w", "e"]]
  },

  nurture: {
    nodes: {
      t: S("A form is filled in", "trigger", "A new contact arrives, from anywhere.", ["source"]),
      g: S("Label them", null, "Labelled as a new lead so the sequence knows who it is talking to.", ["lead"]),
      p: S("Put them in the pipeline", null, "On the board at the first stage, visible rather than sitting in an inbox.", ["stage"]),
      e1: S("Email one: hello", null,
        "Who you are and why they are hearing from you. Nothing is asked for yet.", ["email"]),
      w: S("Wait", "wait",
        "Days, not minutes. The gap is the difference between a sequence and a blast.", []),
      e2: S("Emails two to five", null,
        "The story, the useful one, the offer, the proof. Each one is a separate step, so any of them can be changed without touching the rest.", ["email"]),
      e6: S("Email six: the objections", "end",
        "It answers what people actually push back on, and then it STOPS. A sequence with no end is spam with a schedule.", ["email"])
    },
    edges: [["t", "g"], ["g", "p"], ["p", "e1"], ["e1", "w"], ["w", "e2"], ["e2", "e6"]]
  },

  booked: {
    nodes: {
      t: S("They book a call", "trigger", "A real booking, in your calendar.", ["when"]),
      g: S("Label the booking", null, "Labelled as booked, which is a different state from interested.", ["booked"]),
      o: S("Move them down the pipeline", null, "The board shows a booked call rather than an open lead.", ["stage"]),
      x: S("Take them out of the chase", "decision",
        "The most important step on this page. Without it the person who just booked keeps getting messages asking them to book, which is the fastest way to lose someone who already said yes.", ["removed"]),
      c: S("Confirm it", null, "Confirmation with the time and what happens next.", ["email"]),
      r3: S("Three days before", null, "The first reminder, far enough out to be useful.", ["sms"]),
      r2: S("Two days before", null, "The second, when plans firm up.", ["sms"]),
      r1: S("The day before", "end",
        "The last one, the day before. Four touches, none of them sent by a person.", ["sms"])
    },
    edges: [["t", "g"], ["g", "o"], ["o", "x"], ["x", "c"], ["c", "r3"], ["r3", "r2"], ["r2", "r1"]]
  },

  fb: {
    nodes: {
      t: S("Someone comments", "trigger", "A public comment on a post.", ["source"]),
      w: S("Wait a moment", "wait",
        "A pause before replying. An instant answer to a comment reads as a robot, and waiting costs nothing.", []),
      r: S("Reply in public", null,
        "Answered where everyone else can see it, because the answer is worth more to the people reading than to the person asking.", []),
      w2: S("Wait again", "wait", "Another beat, so the private message does not land on top of the public reply.", []),
      m: S("Message them privately", "decision",
        "Now privately, where the conversation can actually go somewhere.", ["sms"]),
      y: S("They ask for the link", "end", "They reply, and the conversation is a real one.", ["reply"]),
      n: S("Nothing more", "fail",
        "Silence is allowed to be the end of it. No second message, no third.", ["nothing"])
    },
    edges: [["t", "w"], ["w", "r"], ["r", "w2"], ["w2", "m"], ["m", "y", "they reply"], ["m", "n", "silence"]]
  },

  ig: {
    nodes: {
      t: S("Someone comments", "trigger", "The same intent can arrive two ways.", ["source"]),
      d: S("Comment or message?", "decision",
        "A public comment and a private message are the same question arriving differently, and they are answered differently on purpose.", []),
      c: S("Answer the comment", null,
        "Answered in public and kept short. The reply is worth more to the people reading the thread than to the person who asked.", []),
      m: S("Answer the message", null,
        "Answered in private, where there is room to actually deal with the question rather than perform an answer.", []),
      o: S("Offer them a place", "decision", "Only now is anything offered.", []),
      y: S("Count them in", "end", "They are in, and the record says so.", ["qualified", "reply"]),
      n: S("Leave it there", "fail",
        "A no is a real answer and it is taken at face value, not answered with another offer.", ["nothing"])
    },
    edges: [["t", "d"], ["d", "c", "comment"], ["d", "m", "message"], ["c", "o"], ["m", "o"],
      ["o", "y", "yes"], ["o", "n", "not for me"]]
  },

  speed: {
    nodes: {
      t: S("A new lead lands", "trigger",
        "The clock that matters starts here, and it is measured in minutes.", ["lead", "source"]),
      c1: S("Opening message", null,
        "A text within moments of the lead arriving, while they still remember filling the form in.", ["sms"],
        "Hi {name}, saw you were looking at {thing} - still after that, or has it sorted itself out?"),
      r: S("Do they reply?", "decision",
        "Everything after this point depends on a human answering. Nothing is assumed.", ["reply"]),
      c2: S("Conversations two to five", null,
        "Five stages of real back-and-forth, each one its own workflow, so a stage can be rewritten without disturbing the others.", ["sms", "reply"]),
      q: S("Qualified?", "decision",
        "The gate. It decides whether a person is worth a person.", ["qualified"]),
      h: S("Hand to a human", "end",
        "It never tries to close. Its whole job is to reach someone who is still interested and hand them over warm.", ["notify", "qualified"]),
      s: S("Stop, quietly", "fail",
        "No reply, or not a fit. It stops rather than sending the sixth message.", ["nothing"])
    },
    edges: [["t", "c1"], ["c1", "r"], ["r", "c2", "yes"], ["r", "s", "no reply"],
      ["c2", "q"], ["q", "h", "yes"], ["q", "s", "no"]]
  },

  defib: {
    nodes: {
      t: S("An old lead is picked", "trigger",
        "Someone who went cold months ago and that nobody has time to ring twice.", ["source"]),
      c1: S("Opening message", null,
        "It opens by admitting the gap rather than pretending there was not one.", ["sms"],
        "Hi {name} - we spoke a while back about {thing}. Probably long sorted, but thought I would check."),
      r: S("Any answer?", "decision", "Most will not answer, and that is the expected case.", ["reply"]),
      c2: S("Conversations two to five", null,
        "The same five-stage structure as the other engine, aimed at a colder audience.", ["sms", "reply"]),
      l: S("Send the calendar link", "decision",
        "The link is GATED. Sent to everyone, a booking page becomes a spam complaint.", []),
      n: S("Tell you they qualified", "end",
        "You hear about it once it is worth hearing about, and not before.", ["notify", "qualified"]),
      s: S("Let them be", "fail",
        "Back to dormant, with nothing sent that anyone would resent.", ["nothing"])
    },
    edges: [["t", "c1"], ["c1", "r"], ["r", "c2", "yes"], ["r", "s", "nothing"],
      ["c2", "l"], ["l", "n", "they qualify"], ["l", "s", "they do not"]]
  },

  quit: {
    nodes: {
      t: S("They reply: quit", "trigger",
        "Three separate triggers watch for Quit, QUIT and quit, because a person who wants out will not check their capital letters first.", ["optout"]),
      d: S("Stop all messages", null,
        "Everything stops before anything else runs. No goodbye message, no last offer.", ["removed"]),
      r1: S("Out of stage one", null, "Removed from the first conversation.", ["removed"]),
      r2: S("Out of stages two to four", null,
        "And the middle three, each removed on its own. A person left in one of five conversations is worse off than one who was never in any of them.", ["removed"]),
      r5: S("Out of stage five", "end",
        "Nothing left running. This exists twice, once for each conversation engine, because a half-removed person is worse than one who was never in.", ["removed"])
    },
    edges: [["t", "d"], ["d", "r1"], ["r1", "r2"], ["r2", "r5"]]
  },

  qualify: {
    nodes: {
      t: S("Their record changes", "trigger",
        "Any change at all. Most of them will turn out not to matter.", []),
      q: S("Do they qualify?", "decision",
        "The gate, and everything past it is worth your attention.", []),
      g: S("Label them", null, "Labelled as qualified, so the board can be filtered on it.", ["qualified"]),
      f: S("Note what they want", null,
        "Written down in their own terms, so whoever picks up the call is not starting from nothing.", ["want"]),
      o: S("Move them down the pipeline", null, "On to the stage that means a person should call.", ["stage"]),
      n: S("Tell you", "end",
        "You are interrupted here, and only here.", ["notify"]),
      x: S("Say nothing", "fail",
        "The correct outcome most of the time. A notification for every change is a notification nobody reads.", ["nothing"])
    },
    edges: [["t", "q"], ["q", "g", "yes"], ["q", "x", "no"], ["g", "f"], ["f", "o"], ["o", "n"]]
  },

  emailcall: {
    nodes: {
      t: S("A campaign starts", "trigger", "A list, and a reason to contact it.", []),
      e: S("Emails go out", null, "The cheap step, sent to everyone.", ["email"]),
      o: S("Did they open it?", "decision",
        "Interest decides who gets a human. This is the whole idea.", ["reply"]),
      c: S("Queue a call", "end",
        "A call, only to people who showed up, so nobody spends the day ringing people who never opened anything.", ["notify", "stage"]),
      r: S("Keep emailing", null, "The rest stay on the cheap route until they do something.", ["email"])
    },
    edges: [["t", "e"], ["e", "o"], ["o", "c", "engaged"], ["o", "r", "not yet"]]
  }
};
