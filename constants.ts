import { Settings, UserStats } from './types';

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 20,
  autoPronounce: true,
  enableSoundEffects: true,
  accent: 'US',
  theme: 'light',
};

export const INITIAL_STATS: UserStats = {
  totalLearned: 0,
  studyTimeSeconds: 0,
  streakDays: 0,
  lastStudyDate: 0,
};

export const SAMPLE_TEXTS = [
  `Artificial Intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by humans or animals.
Machine learning is a subset of AI that involves the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.
Neural networks are a series of algorithms that endeavor to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates.`,
  
  `To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles
And by opposing end them? To die: to sleep;
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to, 'tis a consummation
Devoutly to be wish'd.`,

  `The climate crisis is not just an environmental issue; it is a social, economic, and political challenge that requires global cooperation.
Renewable energy sources such as solar and wind power are essential for reducing carbon emissions and mitigating the effects of global warming.
Investing in green technology creates jobs and fosters sustainable development for future generations.`,

  `Coffee is a brewed drink prepared from roasted coffee beans, the seeds of berries from certain Coffea species.
From the coffee fruit, the seeds are separated to produce a stable, raw product: unroasted green coffee.
The seeds are then roasted, a process which transforms them into a consumable product: roasted coffee.
Depending on the roast, coffee can have a range of tastes, from fruity and acidic to bitter and smoky.`
];

export const QUOTES = [
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "To have another language is to possess a second soul.", author: "Charlemagne" },
  { text: "Language is the road map of a culture. It tells you where its people come from.", author: "Rita Mae Brown" },
  { text: "Investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "A different language is a different vision of life.", author: "Federico Fellini" },
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" }
];