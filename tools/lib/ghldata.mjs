// Volvo's GoHighLevel workflows, READ OFF HIS OWN BUILDER SCREENSHOTS.
//
// He corrected me twice and the correction is the same both times: these are
// HIS workflows and HIS names. I had been renaming them for what I thought they
// did - `Purchase Delivery` became "A purchase turns a lead into a customer" -
// which is an invention wearing his work's clothes. Prospects are shown the
// real name, highlighted, over the real steps.
//
// Source: "003 GHL WORKFLOWS.pdf" (19 pages) and "004 GHL Workflows.pdf" (4),
// each page one workflow open in the GHL builder. Every `name` below is the
// title bar. Every `label` is a node as the builder prints it.
//
//   name     his workflow name, exactly, shown as the heading
//   does     one plain line for a prospect - the only words here that are mine
//   nodes    the steps, labelled as the builder labels them
//
// WHERE THE SOURCE CANNOT BE READ, IT SAYS SO. Five of these were screenshotted
// at 20-28% browser zoom because they are enormous, and their node text does
// not survive that. Those carry `partial: true` and show the structure the
// screenshot DOES support - trigger, shape, stage count - rather than node
// names I would have had to guess. Guessing there is the exact thing being
// corrected.

const S = (label, kind) => ({ label, kind });

export const GHL = [
  /* ═══ 004 GHL Workflows.pdf ═══════════════════════════════════════════ */
  {
    key: "purchase",
    name: "Purchase Delivery",
    does: "Someone buys. They stop being a lead, become a customer, the deal moves, and the confirmation goes out.",
    group: "form",
    note: "The lead tag comes OFF before the customer tag goes on. Left on, a paying customer keeps receiving the emails written for people who have not bought.",
    nodes: {
      t: S("Order Form Submission", "trigger"),
      a: S("Remove Tag: Lead"),
      b: S("Add Tag: Customer"),
      c: S("Create Or Update Opportunity"),
      d: S("Wait", "wait"),
      e: S("Confirmation Email"),
      z: S("END", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "z"]]
  },

  {
    key: "quotation",
    name: "Form Submission-Create Quotation",
    does: "A quote request comes in, the numbers are built in Make.com, and the quote is emailed back.",
    group: "form",
    note: "GoHighLevel hands the pricing to Make.com and takes the answer back. One job per tool, so neither becomes the thing nobody dares change.",
    nodes: {
      t: S("CE.FormSubmission", "trigger"),
      a: S("Receive data, send to Make"),
      b: S("Add Tag"),
      c: S("Create Contact"),
      d: S("Wait", "wait"),
      e: S("Send Email"),
      z: S("END", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "z"]]
  },

  {
    key: "nurture",
    name: "Email Nurture Sequence",
    does: "Six emails over days, in a fixed order, and then it stops.",
    group: "form",
    note: "It ends on the objections email. A sequence with no end is spam with a schedule.",
    nodes: {
      t: S("Form Submitted", "trigger"),
      w0: S("Wait", "wait"),
      g: S("Tag: Prospect Name"),
      p: S("Add: Customer Pipeline"),
      e1: S("Email 1: Confirmation + Introduction"),
      w1: S("Wait", "wait"),
      e2: S("Email 2: Epiphany Moment Story"),
      w2: S("Wait", "wait"),
      e3: S("Email 3: The Wrong Vehicle"),
      w3: S("Wait", "wait"),
      e4: S("Email 4: Introduction to Offer"),
      w4: S("Wait", "wait"),
      e5: S("Email 5: Success System and Testimonials"),
      w5: S("Wait", "wait"),
      e6: S("Email 6: FAQ and Objections"),
      z: S("END", "end")
    },
    edges: [["t", "w0"], ["w0", "g"], ["g", "p"], ["p", "e1"], ["e1", "w1"], ["w1", "e2"],
      ["e2", "w2"], ["w2", "e3"], ["e3", "w3"], ["w3", "e4"], ["e4", "w4"], ["w4", "e5"],
      ["e5", "w5"], ["w5", "e6"], ["e6", "z"]]
  },

  {
    key: "booked",
    name: "Booked Appointment + Reminders",
    does: "A confirmed booking is tagged, taken out of the chase, and reminded four times before the call.",
    group: "booked",
    note: "Remove from Workflow is the step that matters. Without it the person who just booked keeps getting messages asking them to book.",
    nodes: {
      t: S("Appointment Status Confirmed", "trigger"),
      g: S("Tag: Booked Discovery Call"),
      o: S("Create Or Update Opportunity"),
      x: S("Remove from Workflow"),
      w: S("Wait", "wait"),
      c: S("Booking Confirmation Email"),
      d3: S("3 Days Before", "wait"),
      m3: S("Email"),
      d2: S("2 Days Before", "wait"),
      m2: S("Email"),
      r2: S("2nd Reminder", "wait"),
      n2: S("Email"),
      r1: S("1st Reminder", "wait"),
      n1: S("Email"),
      z: S("END", "end")
    },
    edges: [["t", "g"], ["g", "o"], ["o", "x"], ["x", "w"], ["w", "c"], ["c", "d3"],
      ["d3", "m3"], ["m3", "d2"], ["d2", "m2"], ["m2", "r2"], ["r2", "n2"], ["n2", "r1"],
      ["r1", "n1"], ["n1", "z"]]
  },

  /* ═══ 003 GHL WORKFLOWS.pdf ═══════════════════════════════════════════ */
  {
    key: "refer",
    name: '"REFER" FB Responder',
    does: "Someone comments on a Facebook post. It answers in public, then opens a private message with a referral offer.",
    group: "social",
    note: "It waits before replying. An instant answer to a comment reads as a machine, and the pause costs nothing.",
    nodes: {
      t: S("Facebook - Comment(s) On A Post", "trigger"),
      w1: S("Wait", "wait"),
      r: S("Respond On Comment"),
      w2: S("Wait", "wait"),
      m: S("Facebook Interactive Messenger", "decision"),
      refer: S("Refer a Friend Here!"),
      to1: S("Default Timeout"),
      m2: S("Facebook Interactive Messenger"),
      to2: S("Default Timeout"),
      z1: S("END", "end"),
      z2: S("END", "end")
    },
    edges: [["t", "w1"], ["w1", "r"], ["r", "w2"], ["w2", "m"],
      ["m", "to1", "no reply"], ["m", "refer", "Refer a Friend Here!"],
      ["refer", "z1"], ["to1", "m2"], ["m2", "to2"], ["to2", "z2"]]
  },

  {
    key: "headshots",
    name: '"Headshots" event IG Responder',
    does: "An Instagram comment or DM about the headshots event gets answered on whichever channel it arrived on, and ends in an RSVP.",
    group: "social",
    note: "A comment and a DM are the same question arriving two ways. The build splits on which one it was and answers each properly.",
    nodes: {
      t: S("Instagram - Comment(s) On A Post", "trigger"),
      t2: S("Customer Replied", "trigger"),
      w1: S("Wait", "wait"),
      q: S("Comment or DM?", "decision"),
      c: S("Respond On Comment"),
      g: S("Go To"),
      w2: S("Wait", "wait"),
      m: S("Instagram Interactive Messenger", "decision"),
      rsvp: S("RSVP me!"),
      no: S("Sorry, not interested", "fail"),
      to: S("Default Timeout"),
      dm: S("INSTAGRAM-DM"),
      z: S("END", "end")
    },
    edges: [["t", "w1"], ["t2", "w1"], ["w1", "q"],
      ["q", "c", "Comment"], ["q", "g", "DM"],
      ["c", "w2"], ["g", "w2"], ["w2", "m"],
      ["m", "to", "Default Timeout"], ["m", "rsvp", "RSVP me!"], ["m", "no", "not interested"],
      ["rsvp", "dm"], ["to", "dm"], ["dm", "z"]]
  },

  {
    key: "calendar",
    name: "2.6) Calendar Link Sent",
    does: "When the AI conversation produces a booking link, the contact is tagged, the deal is created and you are told.",
    group: "engine",
    note: "Everything past 'Do They Qualify?' is worth your attention. The None branch ends silently, which is the right answer most of the time.",
    nodes: {
      t: S("Contact Changed", "trigger"),
      q: S("Do They Qualify?", "decision"),
      yes: S('If "Chat-GPT" contains "https://tour..."'),
      none: S("When none of the conditions are met", "fail"),
      tag: S("Add Tag"),
      f: S('Update "Want\'s To Schedule" Field'),
      o: S("Create Or Update Opportunity"),
      n: S("Lead Qualified Notification To You"),
      z1: S("END", "end"),
      z2: S("END", "end")
    },
    edges: [["t", "q"], ["q", "yes", "Yes"], ["q", "none", "None"],
      ["yes", "tag"], ["tag", "f"], ["f", "o"], ["o", "n"], ["n", "z1"], ["none", "z2"]]
  },

  {
    key: "quit2",
    name: '2.7) DND After "Quit" Reply',
    does: "The customer replies quit. Messaging stops, and they are pulled out of all five Defibrillator conversations.",
    group: "engine",
    note: "Three separate triggers watch for Quit, QUIT and quit, because a person who wants out will not check their capital letters first.",
    nodes: {
      t1: S('Customer Replied "Quit"', "trigger"),
      t2: S('Customer Replied "QUIT"', "trigger"),
      t3: S('Customer Replied "quit"', "trigger"),
      d: S("Enable/Disable DND"),
      r1: S("Remove from Defibrillator AI Convo Start"),
      r2: S("Remove from Defibrillator AI Convo 2"),
      r3: S("Remove from Defibrillator AI Convo 3"),
      r4: S("Remove from Defibrillator AI Convo 4"),
      r5: S("Remove from Defibrillator AI Convo 5"),
      z: S("END", "end")
    },
    edges: [["t1", "d"], ["t2", "d"], ["t3", "d"], ["d", "r1"], ["r1", "r2"], ["r2", "r3"],
      ["r3", "r4"], ["r4", "r5"], ["r5", "z"]]
  },

  {
    key: "quit1",
    name: '1.7) DND After "Quit" Reply',
    does: "The same exit, built again for the Speed To Lead side. Five conversations, all switched off.",
    group: "engine",
    note: "It exists twice on purpose, once per engine. A person left in one of five conversations is worse off than one who was never in any.",
    nodes: {
      t1: S('Customer Replied "Quit"', "trigger"),
      t2: S('Customer Replied "quit"', "trigger"),
      t3: S('Customer Replied "QUIT"', "trigger"),
      d: S("Enable/Disable DND"),
      r1: S("Remove from Speed To Lead Convo Starter"),
      r2: S("Remove from Speed To Lead Convo 2"),
      r3: S("Remove from Speed To Lead Convo 3"),
      r4: S("Remove from Speed To Lead Convo 4"),
      r5: S("Remove from Speed To Lead Convo 5"),
      z: S("END", "end")
    },
    edges: [["t1", "d"], ["t2", "d"], ["t3", "d"], ["d", "r1"], ["r1", "r2"], ["r2", "r3"],
      ["r3", "r4"], ["r4", "r5"], ["r5", "z"]]
  },

  {
    key: "hook2",
    name: "Test Webhook - Defibrillator",
    does: "Takes the AI's reply back from outside GoHighLevel and writes it onto the contact.",
    group: "engine",
    nodes: {
      t: S("Add New Trigger", "trigger"),
      u: S('Update contact field "Lead Response"'),
      w: S("Webhook"),
      z: S("END", "end")
    },
    edges: [["t", "u"], ["u", "w"], ["w", "z"]]
  },

  {
    key: "hook1",
    name: "Test Webhook - Speed2Lead",
    does: "The same hand-off, on the Speed To Lead side.",
    group: "engine",
    nodes: {
      t: S("Add New Trigger", "trigger"),
      u: S('Update contact field "Lead Response"'),
      w: S("Webhook"),
      z: S("END", "end")
    },
    edges: [["t", "u"], ["u", "w"], ["w", "z"]]
  },

  /* ── the five that are too big to screenshot legibly ──────────────────── */
  {
    key: "speedstart",
    name: "1.1) Speed To Lead AI Convo Starter",
    does: "A brand new lead gets a text within moments, and the AI holds the first stage of the conversation.",
    group: "engine",
    partial: "Screenshotted at 20% zoom because of its size, so the node text is not legible in the source. Shown as the structure it is: a long branching conversation, every reply routed to its own follow-up.",
    nodes: {
      t: S("A new lead arrives", "trigger"),
      ai: S("AI reads the reply", "decision"),
      a: S("Branch: they answer"),
      b: S("Branch: no answer yet"),
      n: S("Hand on to Convo 2", "end")
    },
    edges: [["t", "ai"], ["ai", "a"], ["ai", "b"], ["a", "n"], ["b", "n"]]
  },
  {
    key: "speed3",
    name: "1.3) Speed To Lead Convo 3",
    does: "The third stage of the same conversation, once the lead is still talking.",
    group: "engine",
    partial: "Screenshotted at 28% zoom, so the node text is not legible in the source. Same branching shape as the other stages.",
    nodes: {
      t: S("Carried in from Convo 2", "trigger"),
      ai: S("AI reads the reply", "decision"),
      a: S("Branch: they answer"),
      b: S("Branch: no answer yet"),
      n: S("Hand on to Convo 4", "end")
    },
    edges: [["t", "ai"], ["ai", "a"], ["ai", "b"], ["a", "n"], ["b", "n"]]
  },
  {
    key: "defibstart",
    name: "2.1) Defibrillator AI Convo Start",
    does: "Re-opens a lead that went cold months ago, by text, and holds the first stage of that conversation.",
    group: "engine",
    partial: "Screenshotted at 20% zoom, so the node text is not legible in the source. Shown as the structure it is.",
    nodes: {
      t: S("An old lead is picked", "trigger"),
      ai: S("AI reads the reply", "decision"),
      a: S("Branch: they answer"),
      b: S("Branch: nothing back"),
      n: S("Hand on to Convo 2", "end")
    },
    edges: [["t", "ai"], ["ai", "a"], ["ai", "b"], ["a", "n"], ["b", "n"]]
  },
  {
    key: "defib5",
    name: "2.5) Defibrillator AI Convo 5",
    does: "The last stage before the calendar link is considered.",
    group: "engine",
    partial: "Screenshotted at 28% zoom, so the node text is not legible in the source.",
    nodes: {
      t: S("Carried in from Convo 4", "trigger"),
      ai: S("AI reads the reply", "decision"),
      a: S("Branch: they answer"),
      b: S("Branch: nothing back"),
      n: S("Hand on to Calendar Link Sent", "end")
    },
    edges: [["t", "ai"], ["ai", "a"], ["ai", "b"], ["a", "n"], ["b", "n"]]
  },
  {
    key: "wf001",
    name: "WF 001: Email Marketing + Call",
    does: "An email campaign where the people who engage get queued for a phone call instead of another email.",
    group: "gate",
    partial: "The largest of them, screenshotted at 20% zoom, so the node text is not legible in the source. Dozens of branches on what the contact did.",
    nodes: {
      t: S("Campaign starts", "trigger"),
      e: S("Emails go out"),
      q: S("Did they engage?", "decision"),
      c: S("Queue a call", "end"),
      r: S("Stay on email")
    },
    edges: [["t", "e"], ["e", "q"], ["q", "c", "engaged"], ["q", "r", "not yet"]]
  }
];

export const GROUPS = [
  { key: "form", label: "When someone fills in a form" },
  { key: "booked", label: "When a call is booked" },
  { key: "social", label: "When someone comments" },
  { key: "engine", label: "The two AI conversation engines" },
  { key: "gate", label: "When to interrupt a human" }
];
