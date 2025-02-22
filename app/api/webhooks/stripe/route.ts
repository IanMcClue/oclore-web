import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'
import stripe from '@/lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createClient()

  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      
      // Update subscription status
      await (await supabase)
        .from('subscriptions')
        .update({
          status: 'active',
          stripe_subscription_id: checkoutSession.subscription as string,
          plan_type: checkoutSession.metadata?.planType,
        })
        .eq('stripe_customer_id', checkoutSession.customer as string)

      // Create initial tasks for the user
      const { data: userData } = await (await supabase)
        .from('user_stories')
        .select('routines')
        .eq('user_id', checkoutSession.metadata?.userId)
        .single()

      if (userData?.routines) {
        const routines = JSON.parse(userData.routines)
        const startDate = new Date()
        const tasks: { user_id: string | undefined; title: string; amount: string; time: string; icon: string; progress: number; date: string }[] = []

        for (let i = 0; i < 7; i++) {
          const taskDate = new Date(startDate)
          taskDate.setDate(startDate.getDate() + i)
          const dateString = taskDate.toISOString().split('T')[0]

          routines.dailyRoutines.forEach((routine: string, index: number) => {
            tasks.push({
              user_id: checkoutSession.metadata?.userId,
              title: routine,
              amount: 'Daily',
              time: '9:00 AM',
              icon: '🔄',
              progress: 0,
              date: dateString,
            })
          })
        }

        await (await supabase).from('tasks').insert(tasks)
      }

      break
    case 'invoice.payment_succeeded':
      // Handle successful recurring payments
      const invoice = event.data.object as Stripe.Invoice
      await (await supabase)
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date(invoice.period_start * 1000).toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription as string)
      break
    case 'customer.subscription.deleted':
      // Handle subscription cancellations
      const subscription = event.data.object as Stripe.Subscription
      await (await supabase)
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

