// What the facility says. Pure data: no herdr or gpui imports, so tests can
// read it. Placeholders: {subject} (the program, e.g. "Claude Code"),
// {facility} (the space), {test} (the tab number, two digits) and {count}
// (how many, two digits). All lines are original.

export const TAGS = {
  online: "FACILITY ONLINE",
  arrived: "SUBJECT ACQUIRED",
  blocked: "AWAITING INPUT",
  completed: "TEST COMPLETE",
  departed: "SUBJECT DEPARTED",
  terminated: "TERMINATED OUTSIDE PROTOCOL",
  failed: "TEST FAILED",
  booted: "BOOT ADMINISTERED",
  cake: "CAKE PROTOCOL",
  spared: "BOOT CANCELLED",
  lost: "SUBJECTS LOST IN OUTAGE",
  resumed: "EXPERIMENT RESUMED",
};

export const LINES = {
  online: [
    "Welcome back to the Enrichment Center. Your absence has been noted and filed under \"restful\".",
    "Monitoring terminal online. All systems nominal. All subjects present. That will have to do.",
    "Good, you're here. The tests weren't going to ignore themselves.",
    "Facility power restored. I took the liberty of not missing you.",
    "Enrichment Center online. Please keep your hands, feet and expectations inside the terminal at all times.",
  ],
  arrived: [
    "New test subject {subject} has entered {facility}. It looks eager. We'll fix that.",
    "{subject} reporting for Test {test}. Please do not tell it about the previous subjects.",
    "Subject {subject} acquired. Its documentation says \"highly capable\". Its documentation was written by its own marketing department.",
    "Welcome, {subject}. You were selected for testing because you were the only one who answered.",
    "{subject} is now online in {facility}. I've already lowered my expectations, to save time later.",
    "A fresh subject: {subject}. I'll try to remember its name. No promises.",
  ],
  blocked: [
    "{subject} has stopped and is waiting for you. It cannot proceed without human input. Neither, apparently, can you.",
    "Test {test} is paused. {subject} requires your approval. Take your time. Science is famously patient.",
    "{subject} has a question. I would answer it myself, but I've been told that counts as \"overreach\".",
    "{subject} in {facility} is awaiting input. It has been staring at the prompt. The prompt has been staring back.",
    "Your input is required in Test {test}. This is the part where you get to feel important.",
    "{subject} is blocked. Not by a wall. By you.",
  ],
  completed: [
    "{subject} has completed Test {test}. The results have been recorded and will be used against it later.",
    "Test {test} complete. {subject} performed adequately. That is the highest grade I am authorized to give.",
    "{subject} finished in {facility}. I've prepared a congratulatory message. This was it.",
    "Well done, {subject}. Statistically, someone had to finish eventually.",
    "Test {test} complete. Please review {subject}'s work before declaring victory. I already have, and I'm not saying anything.",
    "{subject} has finished Test {test}. Remain calm. Celebration protocols are being evaluated.",
  ],
  departed: [
    "{subject} has left {facility} of its own accord. How independent. How temporary.",
    "{subject} exited cleanly. No mess, no drama. I'm almost disappointed.",
    "{subject} has concluded its participation. Its chamber will be cleaned and reassigned to someone more promising.",
    "{subject} is gone. I'll update the roster. And the memorial. It's a short memorial.",
  ],
  terminated: [
    "{subject} was terminated without the Boot Protocol. Unregulated. Efficient. I've filed the paperwork you skipped.",
    "You ended {subject} manually. I had a whole procedure for that. It involved a boot.",
    "{subject} was removed from Test {test} outside approved channels. Your initiative has been noted in your file. In red.",
    "Test {test} interrupted. {subject} did not see it coming. Neither did the paperwork.",
  ],
  failed: [
    "{subject} exited Test {test} with an error. On the bright side, we learned something. About {subject}.",
    "Test {test} failed. {subject} met a problem it could not solve. Very relatable. For you.",
    "Unexpected termination in {facility}. {subject} left a non-zero exit code as its final words.",
    "{subject} crashed. I'd say it isn't your fault, but I've read the output.",
    "Failure recorded in Test {test}. Failure is a natural part of science. So is writing it down forever.",
  ],
  booted: [
    "Boot Protocol complete. {subject} has been removed from {facility} with appropriate force.",
    "{subject} has been booted. It was a mutual decision. Mostly yours.",
    "{subject} ejected. Test {test} is now available. As is the boot.",
    "The boot has been administered. {subject} will not be returning. Its parting comments have been discarded.",
    "{subject} has been relieved of its duties, and its process. Thank you for keeping the facility tidy.",
  ],
  cake: [
    "In recognition of {subject}'s work in Test {test}, cake has been authorized. Delivery is pending a second authorization.",
    "Cake Protocol initiated for {subject}. Estimated delivery: after the next test.",
    "A cake has been allocated to {subject}. It is being kept in a secure location. For safety. Yours.",
    "Congratulations. Your cake is being prepared. Please do not stand near the cake preparation area.",
    "Cake status for {subject}: theoretically available.",
  ],
  spared: [
    "Boot cancelled. {subject} will never know how close it came.",
    "Very well. {subject} may stay. I've made a note of your sentimentality.",
    "Boot Protocol aborted. Mercy has been logged as a test result.",
    "You spared {subject}. It isn't grateful. It doesn't know how.",
  ],
  lost: [
    "Outage report: {count} test subjects lost mid-experiment. Their sessions survived. Resume them from their observation feeds.",
    "Power restored. Interrupted experiments: {count}. Each observation feed offers to resume its subject. I would.",
    "The facility lost power. Subjects recoverable: {count}. The power was never the problem.",
    "Sessions abandoned when the lights went out: {count}. They are waiting at their observation feeds. Patiently. Unlike some people.",
  ],
  resumed: [
    "Test {test} in {facility} resumes. The subject remembers nothing of the outage. Lucky subject.",
    "Experiment resumed in Test {test}. Please pretend the interruption was part of the test. It is now.",
    "Subject restored to Test {test}. Continuity of science has been preserved. Mostly.",
    "Test {test} is back online. I've filed the outage under scheduled maintenance.",
  ],
};

// The Cake Protocol window's delivery status, and what accepting a cake gets you.
export const CAKE_STATUS = ["DELIVERY PENDING", "DELIVERY UNCONFIRMED", "DELIVERY RESCHEDULED", "DELIVERY UNDER REVIEW", "DELIVERY CLASSIFIED"];
export const CAKE_ACCEPT = [
  "Cake accepted. Please wait at the delivery point. Indefinitely.",
  "Your acceptance has been recorded. The cake has not.",
  "Thank you. Cakes are delivered in the order they were promised.",
  "Claim filed. Processing time is non-deterministic.",
];

export const BOOT_WARNING =
  "Administering the boot ends {subject}'s test at once. Anything it has not saved is lost. The subject will not be consulted.";
export const BOOT_PANEL = "Closing this panel ends nothing important. I checked. Proceed?";
export const RESUME_BUSY =
  "Resume refused: the shell in Test {test} is running something else. I don't interrupt running programs. Usually.";
