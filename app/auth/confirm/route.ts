import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Extract both possible sets of parameters
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Validate: must have either a code or a valid (token_hash and type) pair
  if (!code && !(token_hash && type)) {
    return NextResponse.json({ error: 'Invalid confirmation parameters' }, { status: 400 });
  }

  // Define the redirect destination on success
  const next = '/future-story';
  const response = NextResponse.redirect(new URL(next, request.url));
  
  // Create Supabase client with custom cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete(name);
        },
      },
    }
  );

  try {
    let verifyResult;

    // Dual verification path: either exchange a code for session or verify OTP using token_hash
    if (code) {
      verifyResult = await supabase.auth.exchangeCodeForSession(code);
    } else if (token_hash && type) {
      verifyResult = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
    }

    if (!verifyResult) {
      throw new Error('Verification failed: No result returned');
    }

    const { data: { user, session }, error } = verifyResult;
    if (error) throw error;
    if (!user) throw new Error('User not found after verification');

    // Update user responses: either update existing row or migrate anonymous responses
    try {
      // Check if a user_responses row exists for this user
      const { data: existingResponses, error: checkError } = await supabase
        .from('user_responses')
        .select('id, status, responses, session_id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking responses:', checkError);
      }

      if (!existingResponses) {
        // No responses for this user; check for anonymous responses tied to a session_id cookie
        const sessionId = request.cookies.get('session_id')?.value;
        if (sessionId) {
          // Attempt to fetch anonymous responses
          const { data: anonymousResponses, error: migrateError } = await supabase
            .from('user_responses')
            .select('id, responses, session_id')
            .eq('session_id', sessionId)
            .is('user_id', null)
            .single();

          if (migrateError && migrateError.code !== 'PGRST116') {
            console.error('Error migrating responses:', migrateError);
          }

          if (anonymousResponses) {
            // Migrate the anonymous response by updating it with the user_id and marking as verified
            const { error: updateAnonError } = await supabase
              .from('user_responses')
              .update({
                user_id: user.id,
                status: 'verified',
                updated_at: new Date().toISOString(),
              })
              .eq('id', anonymousResponses.id);
            if (updateAnonError) {
              console.error('Error updating anonymous response with user_id:', updateAnonError);
            }
          }
        } else {
          console.log('No existing responses found for user:', user.id);
        }
      } else if (existingResponses.status !== 'verified') {
        // If a response row exists but isn't verified, update its status and timestamp
        const { error: updateError } = await supabase
          .from('user_responses')
          .update({
            status: 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating response status:', updateError);
        }
      }

      return response;
    } catch (updateFlowError) {
      console.error('Error in confirmation flow:', updateFlowError);
      return response;
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'Verification failed'
        )}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL('/auth?error=Invalid confirmation link', request.url)
  );
}
