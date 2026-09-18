// The eleven GoHighLevel systems, drawn the way the Retell map is drawn.
//
// Volvo showed the Retell map and said "the kind of workflow I wanna see": a
// VERTICAL tree. Trigger at the top, routes fanning down, every box carrying a
// name and a short line saying what it is. That shape is the instruction - I
// built it left to right first and that was wrong.
//
// Each step therefore has four things:
//   label  the box's name
//   sub    the small line under it, so a box explains itself before it is tapped
//   says   what fills the panel when it is
//   writes what it leaves on the contact, which is the panel that lights up
//
// The third panel is the one that earns the tap. For a voice agent it is the
// notes the call takes; for a CRM it is the CONTACT RECORD, because that is the
// only thing these builds change. A step that writes nothing says so, and on
// several of these that is the entire point.
//
// Plain words throughout, no client names, nothing invented: every chain is
// read off the build files he supplied.

/* Everything the eleven builds can write on a contact, in the order a person
   would look for them. Each build's list is DERIVED from its own steps. */
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

const S = (label, sub, kind, says, writes = [], quote = null) =>
  ({ label, sub, kind, says, writes, quote });

export const GHL = {
  purchase: {
    nodes: {
      t: S("An order is placed", "where it starts", "trigger",
        "The payment is what starts it. Nobody opens the CRM, and nobody has to remember to.", ["source"]),
      r: S("They stop being a lead", "the label comes off", null,
        "The lead label comes off first. This is the step everyone forgets, and it is the one that stops a paying customer receiving the emails written for people who have not bought.", ["lead"]),
      a: S("They become a customer", "and the new one goes on", null,
        "Order matters here: off, then on, so there is never a moment where they carry both.", ["customer"]),
      o: S("Move them down the pipeline", "the board catches up", null,
        "The deal moves to the stage that means money has changed hands, so your board tells the truth without anyone dragging a card.", ["stage"]),
      w: S("Wait", "on purpose", "wait",
        "A deliberate pause, so your confirmation does not arrive before the payment receipt and read as a mistake.", []),
      e: S("Send the confirmation", "the only thing they see", "end",
        "Confirmed, in their inbox, while they are still on the thank-you page.", ["email"])
    },
    edges: [["t", "r"], ["r", "a"], ["a", "o"], ["o", "w"], ["w", "e"]]
  },

  quote: {
    nodes: {
      t: S("A quote is requested", "where it starts", "trigger",
        "Someone asks what it costs. That question has a very short shelf life.", ["source", "want"]),
      m: S("Hand it to the quote builder", "the numbers happen elsewhere", null,
        "The pricing is worked out by a separate system and handed back. One job per tool, so neither becomes the thing nobody dares change.", []),
      g: S("Label them", "so later builds know", null,
        "Labelled as quoted, so every build after this one knows where the person is without asking.", ["quoted"]),
      c: S("Create the contact", "from what they typed", null,
        "The record is built from their own answers. Nobody retypes it, so nobody mistypes it.", ["want"]),
      w: S("Wait", "a considered pause", "wait",
        "A short pause, so it reads as considered rather than automatic.", []),
      e: S("Send the quote", "in minutes, not tomorrow", "end",
        "A price in their inbox while they are still thinking about it, which is usually the whole difference.", ["email"])
    },
    edges: [["t", "m"], ["m", "g"], ["g", "c"], ["c", "w"], ["w", "e"]]
  },

  nurture: {
    nodes: {
      t: S("A form is filled in", "where it starts", "trigger",
        "A new contact arrives, from anywhere.", ["source"]),
      g: S("Label them", "a new lead", null,
        "Labelled so the sequence knows who it is talking to.", ["lead"]),
      p: S("Put them in the pipeline", "visible, not buried", null,
        "On the board at the first stage, rather than sitting in an inbox.", ["stage"]),
      e1: S("Email one: hello", "nothing is asked for", null,
        "Who you are and why they are hearing from you. Nothing is asked for yet.", ["email"]),
      w: S("Wait", "days, not minutes", "wait",
        "The gap is the difference between a sequence and a blast.", []),
      e2: S("Emails two to five", "story, use, offer, proof", null,
        "Four more, each its own step, so any one of them can be rewritten without touching the rest.", ["email"]),
      e6: S("Email six: the objections", "and then it stops", "end",
        "It answers what people actually push back on, and then it STOPS. A sequence with no end is spam with a schedule.", ["email"])
    },
    edges: [["t", "g"], ["g", "p"], ["p", "e1"], ["e1", "w"], ["w", "e2"], ["e2", "e6"]]
  },

  booked: {
    nodes: {
      t: S("They book a call", "where it starts", "trigger",
        "A real booking, in your calendar.", ["when"]),
      g: S("Label the booking", "booked is not interested", null,
        "Booked is a different state from interested, and everything after this depends on the difference.", ["booked"]),
      o: S("Move them down the pipeline", "the board catches up", null,
        "The board shows a booked call rather than an open lead.", ["stage"]),
      x: S("Take them out of the chase", "the step that matters", "decision",
        "The most important step on this page. Without it, the person who just booked keeps getting messages asking them to book, which is the fastest way to lose someone who already said yes.", ["removed"]),
      c: S("Confirm it", "time and what happens next", null,
        "A confirmation with the time and what to expect.", ["email"]),
      r3: S("Three days before", "far enough out to move", null,
        "The first reminder, early enough that they can still rearrange.", ["sms"]),
      r2: S("Two days before", "when plans firm up", null,
        "The second, at the point people decide what their week looks like.", ["sms"]),
      r1: S("The day before", "the last one", "end",
        "Four touches in total, none of them sent by a person.", ["sms"])
    },
    edges: [["t", "g"], ["g", "o"], ["o", "x"], ["x", "c"], ["c", "r3"], ["r3", "r2"], ["r2", "r1"]]
  },

  fb: {
    nodes: {
      t: S("Someone comments", "where it starts", "trigger",
        "A public comment on a post.", ["source"]),
      w: S("Wait a moment", "so it is not a robot", "wait",
        "A pause before replying. An instant answer to a comment reads as a machine, and waiting costs nothing.", []),
      r: S("Reply in public", "where everyone reads it", null,
        "Answered where the rest of the thread can see it, because the answer is worth more to the people reading than to the person who asked.", []),
      w2: S("Wait again", "one beat more", "wait",
        "So the private message does not land on top of the public reply.", []),
      m: S("Message them privately", "where it can go somewhere", "decision",
        "Now privately, where the conversation has room to become a real one.", ["sms"]),
      y: S("They ask for the link", "a real conversation", "end",
        "They reply, and there is something to actually answer.", ["reply"]),
      n: S("Nothing more", "silence is an answer", "fail",
        "Silence is allowed to be the end of it. No second message, no third.", ["nothing"])
    },
    edges: [["t", "w"], ["w", "r"], ["r", "w2"], ["w2", "m"],
      ["m", "y", "they reply"], ["m", "n", "silence"]]
  },

  ig: {
    nodes: {
      t: S("Someone comments", "where it starts", "trigger",
        "The same question can arrive two different ways.", ["source"]),
      d: S("Comment or message?", "two doors, one question", "decision",
        "A public comment and a private message are the same intent arriving differently, and they are answered differently on purpose.", []),
      c: S("Answer the comment", "in public, briefly", null,
        "Answered in public and kept short. The reply is worth more to the people reading the thread than to the person who asked.", []),
      m: S("Answer the message", "in private, at length", null,
        "Answered in private, where there is room to actually deal with the question rather than perform an answer.", []),
      o: S("Offer them a place", "only now", "decision",
        "Nothing is offered until here.", []),
      y: S("Count them in", "and the record says so", "end",
        "They are in, and it is written down rather than remembered.", ["qualified", "reply"]),
      n: S("Leave it there", "a no is a real answer", "fail",
        "Taken at face value, not answered with another offer.", ["nothing"])
    },
    edges: [["t", "d"], ["d", "c", "comment"], ["d", "m", "message"], ["c", "o"], ["m", "o"],
      ["o", "y", "yes"], ["o", "n", "not for me"]]
  },

  speed: {
    nodes: {
      t: S("A new lead lands", "the clock starts", "trigger",
        "The clock that matters starts here, and it is measured in minutes.", ["lead", "source"]),
      c1: S("Opening message", "within moments", null,
        "A text while they still remember filling the form in.", ["sms"],
        "Hi {name}, saw you were looking at {thing} - still after that, or has it sorted itself out?"),
      r: S("Do they reply?", "nothing is assumed", "decision",
        "Everything past this point depends on a human answering.", ["reply"]),
      c2: S("Conversations two to five", "five stages, five builds", null,
        "Real back-and-forth, each stage its own workflow, so one can be rewritten without disturbing the others.", ["sms", "reply"]),
      q: S("Qualified?", "the gate", "decision",
        "It decides whether a person is worth a person.", ["qualified"]),
      h: S("Hand to a human", "it never closes", "end",
        "Its whole job is to reach someone still interested and hand them over warm.", ["notify", "qualified"]),
      s: S("Stop, quietly", "no sixth message", "fail",
        "No reply, or not a fit. It stops rather than sending one more.", ["nothing"])
    },
    edges: [["t", "c1"], ["c1", "r"], ["r", "c2", "yes"], ["r", "s", "no reply"],
      ["c2", "q"], ["q", "h", "yes"], ["q", "s", "no"]]
  },

  defib: {
    nodes: {
      t: S("An old lead is picked", "cold, months old", "trigger",
        "Someone who went quiet months ago, and that nobody has time to ring twice.", ["source"]),
      c1: S("Opening message", "it admits the gap", null,
        "It opens by admitting the silence rather than pretending there was not one.", ["sms"],
        "Hi {name} - we spoke a while back about {thing}. Probably long sorted, but thought I would check."),
      r: S("Any answer?", "most will not", "decision",
        "Silence is the expected case here, not the failure case.", ["reply"]),
      c2: S("Conversations two to five", "same five stages", null,
        "The same structure as the other engine, aimed at a colder audience.", ["sms", "reply"]),
      l: S("Send the calendar link", "gated, on purpose", "decision",
        "Sent to everyone, a booking page becomes a spam complaint. It goes only to people who qualify.", []),
      n: S("Tell you they qualified", "worth hearing about", "end",
        "You hear about it once it is worth hearing about, and not before.", ["notify", "qualified"]),
      s: S("Let them be", "back to dormant", "fail",
        "Nothing sent that anyone would resent.", ["nothing"])
    },
    edges: [["t", "c1"], ["c1", "r"], ["r", "c2", "yes"], ["r", "s", "nothing"],
      ["c2", "l"], ["l", "n", "they qualify"], ["l", "s", "they do not"]]
  },

  quit: {
    nodes: {
      t: S("They reply: quit", "three triggers, one word", "trigger",
        "Quit, QUIT and quit each have their own trigger, because a person who wants out will not check their capital letters first.", ["optout"]),
      d: S("Stop all messages", "before anything else", null,
        "Everything stops first. No goodbye message, no last offer.", ["removed"]),
      r1: S("Out of stage one", "removed, not paused", null,
        "Taken out of the first conversation entirely.", ["removed"]),
      r2: S("Out of stages two to four", "each on its own", null,
        "The middle three, removed separately. A person left in one of five conversations is worse off than one who was never in any.", ["removed"]),
      r5: S("Out of stage five", "nothing left running", "end",
        "This build exists twice, once per conversation engine, because a half-removed person is the worst outcome available.", ["removed"])
    },
    edges: [["t", "d"], ["d", "r1"], ["r1", "r2"], ["r2", "r5"]]
  },

  qualify: {
    nodes: {
      t: S("Their record changes", "anything at all", "trigger",
        "Any change. Most of them will turn out not to matter.", []),
      q: S("Do they qualify?", "the gate", "decision",
        "Everything past this point is worth your attention. Everything before it is noise.", []),
      g: S("Label them", "so the board can filter", null,
        "Labelled as qualified, which is what makes the board useful.", ["qualified"]),
      f: S("Note what they want", "in their own words", null,
        "Written down as they said it, so whoever picks up the call is not starting from nothing.", ["want"]),
      o: S("Move them down the pipeline", "a person should call", null,
        "On to the stage that means somebody rings them.", ["stage"]),
      n: S("Tell you", "here, and only here", "end",
        "You are interrupted at this point and at no other.", ["notify"]),
      x: S("Say nothing", "the usual outcome", "fail",
        "Correct most of the time. A notification for every change is a notification nobody reads.", ["nothing"])
    },
    edges: [["t", "q"], ["q", "g", "yes"], ["q", "x", "no"], ["g", "f"], ["f", "o"], ["o", "n"]]
  },

  emailcall: {
    nodes: {
      t: S("A campaign starts", "a list and a reason", "trigger",
        "A list, and something worth saying to it.", []),
      e: S("Emails go out", "the cheap step", null,
        "Sent to everyone, because email costs nothing.", ["email"]),
      o: S("Did they open it?", "interest decides", "decision",
        "This is the whole idea: interest decides who gets a human.", ["reply"]),
      c: S("Queue a call", "only the engaged", "end",
        "A call, only to people who showed up, so nobody spends the day ringing people who never opened anything.", ["notify", "stage"]),
      r: S("Keep emailing", "still on the cheap route", null,
        "The rest stay on email until they do something.", ["email"])
    },
    edges: [["t", "e"], ["e", "o"], ["o", "c", "engaged"], ["o", "r", "not yet"]]
  }
};
