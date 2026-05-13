import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body.userId = formData.get('userId') as string;
      body.title = formData.get('title') as string;
      body.text = formData.get('text') as string;
      body.format_key = formData.get('format_key') as string;
      file = formData.get('file') as File;
    } else {
      body = await req.json();
    }
    
    if (!body.userId || !body.text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.userId)) {
      return NextResponse.json({ error: 'Invalid User ID format (UUID expected)' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('drafts').insert({
      user_id: body.userId,
      title: body.title || 'Untitled Draft',
      text: body.text,
      format_key: body.format_key || 'post_square',
      updated_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    
    if (file) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${data.id}/media.${ext}`;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('draft-media')
        .upload(path, buffer, { 
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });
        
      if (!uploadError) {
        await supabaseAdmin.from('draft_media').insert({
          draft_id: data.id,
          storage_path: path,
          file_type: file.type.startsWith('video/') ? 'video' : 'image',
          sort_order: 0,
          uploaded: true
        });
      }
    }

    return NextResponse.json({ success: true, draft: data });
  } catch (error: any) {
    console.error('Draft save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save draft' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Basic UUID validation to prevent DB errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn('Invalid UUID format for userId:', userId);
      return NextResponse.json({ data: [] }); // Return empty array instead of 500
    }

    const { data, error } = await supabaseAdmin
      .from('drafts')
      .select('*, draft_media(storage_path, file_type, uploaded)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Generate signed URLs for media
    const draftsWithMedia = await Promise.all((data || []).map(async (draft) => {
      const media = draft.draft_media?.find((m: any) => m.uploaded) || null;
      let signedUrl = null;
      let mediaType = null;
      
      if (media?.storage_path) {
        const { data: signedData } = await supabaseAdmin.storage
          .from('draft-media')
          .createSignedUrl(media.storage_path, 3600);
        signedUrl = signedData?.signedUrl || null;
        mediaType = media.file_type;
      }
      
      const { draft_media, ...rest } = draft;
      return {
        ...rest,
        thumbnailUrl: signedUrl,
        thumbnailType: mediaType
      };
    }));

    return NextResponse.json({ data: draftsWithMedia });
  } catch (error: any) {
    console.error('Draft fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch drafts' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const draftId = url.searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('drafts').delete().eq('id', draftId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Draft delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete draft' }, { status: 500 });
  }
}
