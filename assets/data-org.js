/* AI Maturity Assessment (organisations). Options are listed in score order (0–3);
   the page shuffles them. "Not sure" is added automatically and is not scored. */
window.PLW_ASSESS = {
  kind: 'org',
  storageKey: 'plw-org-v1',
  minutes: 7,
  hint: 'Choose the answer closest to what happens today.',
  stageMeaning: {
    'AI-curious': "Interested, but AI isn't part of how work gets done yet.",
    'AI-assisted': 'People use AI on their own to speed up tasks. Results depend on individuals.',
    'AI-accelerated': 'Teams use AI in redesigned processes, with owners, rules and measured results.',
    'AI-native': 'AI is built into strategy, systems and daily work, and keeps creating value.'
  },
  dims: [
    { key: 'strategy', name: 'Strategy & value', next: 'Pick two or three AI opportunities tied to business goals, with an owner and a target for each.', service: 'AI Readiness & Strategy', topic: 'readiness' },
    { key: 'leadership', name: 'Leadership & governance', next: 'Name one accountable AI lead and publish a simple policy on approved tools and data.', service: 'AI Leadership & Governance', topic: 'leadership' },
    { key: 'data', name: 'Data & technology', next: 'Map where your key information lives and give everyone one approved, secure AI tool.', service: 'AI Transformation', topic: 'processes' },
    { key: 'work', name: 'Ways of working', next: 'Choose one high-volume process and redesign it with AI from start to finish.', service: 'AI Transformation', topic: 'processes' },
    { key: 'people', name: 'People & skills', next: 'Give every team practical AI training based on their own work.', service: 'AI Capability Development', topic: 'capability' },
    { key: 'culture', name: 'Culture & adoption', next: 'Have leaders use AI visibly, and share one win and one lesson every month.', service: 'AI Capability Development', topic: 'capability' }
  ],
  questions: [
    { dim: 'strategy', text: "How does AI show up in your organisation's plans?", options: [
      "It isn't part of our plans yet",
      'Individuals or teams pursue ideas on their own',
      'Some departments have AI goals with a named owner',
      'AI goals are part of company strategy, with budget and targets that leadership reviews'] },
    { dim: 'strategy', text: 'How do you decide which AI ideas to pursue?', options: [
      "We haven't had to decide yet",
      'Whoever is interested tries what they like',
      'We weigh cost and benefit case by case',
      'We rank opportunities against business goals and fund the strongest'] },
    { dim: 'strategy', text: 'Can you point to results AI has delivered?', options: [
      'Not yet',
      'Stories of people saving time',
      'A few measured wins in specific teams',
      "We track AI's effect on cost, revenue or customer outcomes across the business"] },
    { dim: 'leadership', text: 'Who is responsible for AI in your organisation?', options: [
      'No one in particular',
      'An enthusiast or the IT team, informally',
      'A named leader or working group',
      'An accountable executive, and AI is a regular item on the leadership agenda'] },
    { dim: 'leadership', text: 'What rules guide how people use AI at work?', options: [
      'None that I know of',
      'Informal guidance, mostly word of mouth',
      'A written policy on approved tools and what data can be shared',
      'A written policy, plus review of higher-risk uses and regular updates'] },
    { dim: 'leadership', text: 'How do you handle AI risks such as mistakes, bias, privacy and security?', options: [
      "We haven't looked at them yet",
      'We deal with problems when they come up',
      'Some checks happen before AI is used on important work',
      'Risks are assessed before anything goes live and monitored afterwards'] },
    { dim: 'data', text: 'How easily can teams find the information they need?', options: [
      "It's scattered across files, inboxes and people's heads",
      "Some is in shared systems, but it's hard to pull together",
      'Most key information sits in systems teams can reach',
      'Our information is organised, trusted and ready for AI tools to use'] },
    { dim: 'data', text: 'What AI tools can people use at work?', options: [
      'Only what they find and pay for themselves',
      'Free or personal accounts, used without approval',
      'Approved tools for some teams',
      'Approved tools for everyone, connected to our own systems and information'] },
    { dim: 'data', text: 'Is AI built into the systems you run the business on?', options: [
      'No',
      "We're looking into it",
      'In one or two systems',
      'In many of our core systems, and we keep adding more'] },
    { dim: 'work', text: 'How has AI changed the way work flows through your organisation?', options: [
      "It hasn't",
      'Individuals use it to speed up their own tasks',
      'A few processes have been redesigned around AI',
      'We regularly redesign processes with AI in mind'] },
    { dim: 'work', text: 'How are repetitive tasks handled?', options: [
      'Mostly by hand',
      'With templates and shortcuts',
      'Some are automated, including with AI',
      'Most are automated, so people focus on exceptions and judgement calls'] },
    { dim: 'work', text: 'When someone finds a good way to use AI, what happens next?', options: [
      'Usually nothing; it stays with that person',
      'It gets shared informally',
      "It's written down and some teams adopt it",
      'It becomes standard practice across the organisation'] },
    { dim: 'people', text: 'How confident are your people using AI at work?', options: [
      "Most aren't using it",
      'A few enthusiasts are confident',
      'Many are comfortable with the basics',
      'Most use it confidently and know when not to rely on it'] },
    { dim: 'people', text: 'What AI training do people get?', options: [
      'None',
      'They teach themselves',
      'Some training for some teams',
      'Ongoing training for every role, leaders included'] },
    { dim: 'people', text: 'Do roles and hiring reflect AI?', options: [
      'Not yet',
      "We've talked about it",
      'Some job descriptions include AI skills',
      'AI skills are part of roles, hiring and performance reviews'] },
    { dim: 'culture', text: 'How does leadership talk about AI?', options: [
      'It rarely comes up',
      'With caution or uncertainty',
      'With interest and occasional support',
      'Openly, and leaders use it themselves'] },
    { dim: 'culture', text: 'How do people feel about AI changing their work?', options: [
      'Worried or resistant',
      'Curious but unsure',
      'Mostly positive',
      'Keen, and asking for more'] },
    { dim: 'culture', text: "What happens when an experiment doesn't work?", options: [
      'We avoid experimenting',
      'Failure is frowned on',
      "It's tolerated if it's small",
      "It's expected, and we share what we learned"] }
  ]
};
