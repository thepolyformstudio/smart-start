import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle, Sparkles, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Basic study tracking', '3 subjects', 'Pomodoro timer', 'Basic analytics', 'Spaced revision'],
    current: true,
    color: 'primary',
  },
  {
    name: 'Smart',
    price: '$9.99',
    period: '/month',
    features: ['Everything in Free', 'Unlimited subjects', 'Advanced analytics', 'PDF export', 'Priority support', 'Custom themes'],
    current: false,
    popular: true,
    color: 'secondary',
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    features: ['Everything in Smart', 'AI study suggestions', 'Collaboration', 'Advanced reports', 'API access', 'White-label'],
    current: false,
    color: 'accent',
  },
]

const faqs = [
  { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time.' },
  { q: 'Is there a free trial?', a: 'Yes, Smart and Premium plans come with a 14-day free trial.' },
  { q: 'What payment methods are accepted?', a: 'We will support credit cards, UPI, and other methods.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. No questions asked.' },
]

export default function SubscriptionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <Badge variant="accent" className="mb-4"><Sparkles className="w-3 h-3" /> Coming Soon</Badge>
        <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
          Smart Start Premium
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
          Premium plans coming soon. Unlock powerful features to supercharge your studies.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} variant={plan.popular ? 'gradient' : 'default'} padding="lg" className="relative">
            {plan.popular && (
              <Badge variant="accent" className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <div className={plan.popular ? 'text-white' : ''}>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                  {plan.period}
                </span>
              </div>
              <div className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${plan.popular ? 'text-white/80' : 'text-secondary-500'}`} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {plan.current ? (
                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
              ) : (
                <Button variant={plan.popular ? 'accent' : 'outline'} className="w-full" disabled
                  icon={<Zap className="w-4 h-4" />}>Coming Soon</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-500" /> FAQ
        </h3>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
              <p className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">{faq.q}</p>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
