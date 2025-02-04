import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { plan } = await req.json()

    const prices = {
      basic: 999, // $9.99 in cents
      premium: 1999, // $19.99 in cents
    }

    const unitAmount = prices[plan as keyof typeof prices]

    if (!unitAmount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = existingSubscription?.stripe_customer_id

    if (!stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Save the Stripe customer ID to the database
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        status: 'incomplete',
      })
    }

    // Use absolute URLs for success and cancel
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `Monthly subscription to the ${plan} plan`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/future-story`,
      metadata: {
        userId: user.id,
        planType: plan,
      },
    })

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL')
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' }, 
      { status: 500 }
    )
  }
}

