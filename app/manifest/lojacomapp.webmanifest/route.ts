import { NextResponse } from 'next/server';
import { createSystemManifest } from '@/app/lib/pwa/manifests';

export function GET() {
  return NextResponse.json(createSystemManifest(), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
