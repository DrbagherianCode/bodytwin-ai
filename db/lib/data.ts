// Shared sample data for db/seed.ts.
//
// Pure data, no driver code, no I/O. Matches what each agent runtime
// previously seeded individually. To customize the starter's demo data,
// edit this file — both runtimes will see the changes after `pnpm db:seed`.
//
// BodyTwin AI demo data:
// Voice-first self-evolving wellness agent for the MongoDB Agentic Evolution Hackathon.

export interface UserSeed {
  user_id: string;
  name: string;
  email: string;
  preferences: { language: string; timezone: string };
  wellness_profile?: {
    baseline_sleep_hours: number;
    baseline_resting_heart_rate: number;
    baseline_hrv: number;
    usual_steps: number;
    coaching_preference: string;
    goal: string;
  };
  wearable_today?: {
    sleep_hours_today: number;
    resting_heart_rate_today: number;
    hrv_today: number;
    stress_score_today: 'low' | 'medium' | 'high';
    steps_today: number;
    activity_minutes_today: number;
    recovery_status: string;
  };
}

export interface OrderSeed {
  user_id: string;
  order_id: string;
  items: string[];
  total: number;
  status: 'delivered' | 'pending' | 'shipped' | 'cancelled';
}

export interface KnowledgeSeed {
  title: string;
  content: string;
  category: string;
}

export const USERS: UserSeed[] = [
  {
    user_id: 'user_1',
    name: 'Abbas',
    email: 'abbas@example.com',
    preferences: { language: 'en', timezone: 'Europe/London' },
    wellness_profile: {
      baseline_sleep_hours: 7.3,
      baseline_resting_heart_rate: 62,
      baseline_hrv: 58,
      usual_steps: 8500,
      coaching_preference: 'short, practical, evidence-based wellness coaching',
      goal: 'improve recovery, energy, sleep consistency, and stress resilience',
    },
    wearable_today: {
      sleep_hours_today: 5.6,
      resting_heart_rate_today: 76,
      hrv_today: 39,
      stress_score_today: 'high',
      steps_today: 4200,
      activity_minutes_today: 18,
      recovery_status: 'poor recovery',
    },
  },
  {
    user_id: 'user_2',
    name: 'Demo User',
    email: 'demo@example.com',
    preferences: { language: 'en', timezone: 'Europe/London' },
    wellness_profile: {
      baseline_sleep_hours: 7.0,
      baseline_resting_heart_rate: 64,
      baseline_hrv: 52,
      usual_steps: 7500,
      coaching_preference: 'friendly and concise',
      goal: 'maintain general wellness',
    },
    wearable_today: {
      sleep_hours_today: 6.8,
      resting_heart_rate_today: 65,
      hrv_today: 50,
      stress_score_today: 'medium',
      steps_today: 6900,
      activity_minutes_today: 32,
      recovery_status: 'moderate recovery',
    },
  },
];

export const ORDERS: OrderSeed[] = [
  {
    user_id: 'user_1',
    order_id: 'wellness_demo_1001',
    items: ['BodyTwin AI Recovery Insight', 'Sleep and HRV Coaching Session'],
    total: 0,
    status: 'delivered',
  },
  {
    user_id: 'user_1',
    order_id: 'wellness_demo_1002',
    items: ['Personalised Recovery Walk Recommendation'],
    total: 0,
    status: 'delivered',
  },
];

export const KNOWLEDGE_INPUTS: KnowledgeSeed[] = [
  {
    title: 'Sleep and recovery',
    content:
      'Sleep is one of the strongest foundations for daily recovery. ' +
      'When sleep duration drops below a person’s usual baseline, the body may show signs of under-recovery, ' +
      'including lower energy, reduced focus, higher perceived stress, and lower readiness for intense exercise. ' +
      'For wellness coaching, practical actions include prioritising an earlier bedtime, reducing late caffeine, ' +
      'keeping the evening routine calm, and avoiding unnecessarily intense training on low-sleep days.',
    category: 'wellness-recovery',
  },
  {
    title: 'HRV, stress, and recovery readiness',
    content:
      'Heart rate variability, or HRV, is commonly used as a wellness and recovery indicator. ' +
      'A lower HRV compared with a person’s own baseline can be associated with stress load, fatigue, poor sleep, ' +
      'or insufficient recovery. HRV should not be interpreted as a medical diagnosis. ' +
      'In a wellness context, low HRV combined with poor sleep and high stress can support a recommendation for a lighter day, ' +
      'breathing exercises, hydration, and gentle activity rather than maximal training.',
    category: 'wearable-signals',
  },
  {
    title: 'Elevated resting heart rate',
    content:
      'A resting heart rate that is higher than a person’s usual baseline can appear when the body is under strain, ' +
      'for example after poor sleep, stress, dehydration, heavy training, or illness. ' +
      'This is not a diagnosis, but in wellness coaching it is a useful signal to reduce intensity, monitor symptoms, ' +
      'hydrate, and prioritise recovery. If elevated resting heart rate is persistent or accompanied by concerning symptoms, ' +
      'the user should consider speaking with a qualified healthcare professional.',
    category: 'wearable-signals',
  },
  {
    title: 'Hydration and light recovery activity',
    content:
      'On low-recovery days, simple actions are often more useful than aggressive training. ' +
      'Hydration, balanced meals, light mobility, and a 15 to 30 minute easy walk can support recovery without adding major stress. ' +
      'A recovery walk should feel easy and conversational, not like a workout. ' +
      'The goal is to help circulation, reduce stiffness, and support mood while avoiding additional overload.',
    category: 'wellness-actions',
  },
  {
    title: 'When to seek medical help',
    content:
      'A wellness agent must not diagnose disease or prescribe treatment. ' +
      'If a user reports chest pain, fainting, severe shortness of breath, severe dizziness, signs of stroke, severe allergic reaction, ' +
      'or any emergency-like symptoms, the agent should advise urgent medical support immediately. ' +
      'If fatigue, unusually high resting heart rate, dizziness, or breathlessness persists or worsens, the user should consult a qualified healthcare professional.',
    category: 'safety',
  },
  {
    title: 'BodyTwin AI demo interpretation',
    content:
      'For the BodyTwin AI demo user Abbas, today’s wearable-style signals show sleep of 5.6 hours versus a 7.3 hour baseline, ' +
      'resting heart rate of 76 versus a 62 baseline, HRV of 39 versus a 58 baseline, high stress, 4200 steps, and 18 activity minutes. ' +
      'This combination suggests poor recovery in a wellness coaching context. ' +
      'A suitable recommendation is to avoid a hard workout today, choose light recovery, hydrate, take a short easy walk, ' +
      'reduce avoidable stressors, and prioritise sleep tonight. This should be framed as wellness guidance, not medical advice.',
    category: 'bodytwin-demo',
  },
];