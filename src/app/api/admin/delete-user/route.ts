import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  // Check env vars are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey })
    return NextResponse.json(
      { error: 'Server misconfiguration: missing environment variables.' },
      { status: 500 }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Use the service role client — bypasses RLS and can verify any JWT
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the caller's JWT token
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      console.error('Auth error:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    // Check caller is an admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError.message)
      return NextResponse.json({ error: 'Failed to verify admin status.' }, { status: 500 })
    }

    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get the target user ID
    const body = await req.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === caller.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    // Delete the user from auth.users (cascades to all related data)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Delete user error:', deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Unexpected error in delete-user route:', err?.message || err)
    return NextResponse.json({ error: `Internal server error: ${err?.message || 'unknown'}` }, { status: 500 })
  }
}
