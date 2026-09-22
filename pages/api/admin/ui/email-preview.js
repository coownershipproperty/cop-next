/**
 * GET /api/admin/ui/email-preview?name=<template>
 *
 * Renders one of the React Email templates in emails/ to HTML, with its own
 * sample props, and returns it as a document. Built 22 Sep 2026 alongside the
 * black/white/grey email re-skin: the templates were re-coloured and retyped in
 * one sweep and there was no way to look at the result short of sending
 * twenty-one emails to yourself.
 *
 * Admin only, and read-only — nothing here sends, queues or stores anything.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { render } from '@react-email/render';
import React from 'react';
import { TEMPLATES } from '@/lib/email/templateList';


const loaders = {
  'newsletter':                 () => import('@/emails/newsletter'),
  'new-listings-digest':        () => import('@/emails/new-listings-digest'),
  'personalised-newsletter':    () => import('@/emails/personalised-newsletter'),
  'property-alert':             () => import('@/emails/property-alert'),
  'price-drop-alert':           () => import('@/emails/price-drop-alert'),
  'seasonal-spotlight':         () => import('@/emails/seasonal-spotlight'),
  'gallery-nurture':            () => import('@/emails/gallery-nurture'),
  'nurture-day3':               () => import('@/emails/nurture-day3'),
  'nurture-day7':               () => import('@/emails/nurture-day7'),
  'nurture-day14':              () => import('@/emails/nurture-day14'),
  'nurture-floor-plan':         () => import('@/emails/nurture-floor-plan'),
  'floor-plan':                 () => import('@/emails/floor-plan'),
  'discreet-brochure':          () => import('@/emails/discreet-brochure'),
  'welcome-1':                  () => import('@/emails/welcome-1'),
  'welcome-2':                  () => import('@/emails/welcome-2'),
  'welcome-3':                  () => import('@/emails/welcome-3'),
  're-engagement':              () => import('@/emails/re-engagement'),
  'destination-market-report':  () => import('@/emails/destination-market-report'),
  'collection-access':          () => import('@/emails/collection-access'),
  'viewings-france':            () => import('@/emails/viewings-france'),
  'year-of-weekends':           () => import('@/emails/year-of-weekends'),
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  const name = String(req.query.name || '');
  if (!TEMPLATES.includes(name) || !loaders[name]) {
    return res.status(400).json({ error: 'Unknown template' });
  }

  try {
    const mod = await loaders[name]();
    const Component = mod.default;
    // Every template defaults its own props to sample data, so no props here.
    const html = await render(React.createElement(Component, {}));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).json({ error: 'Render failed', detail: String(err && err.message) });
  }
}
