import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

// Format a list of names as "Alice, Bob and Charlie"
function formatNames(names: string[]): string {
  if (names.length === 0) return 'someone';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const TEMPLATES = [
  (names: string) =>
    `Gentle reminder that ${names} still haven't paid. The pitch doesn't book itself — unlike your excuses, which are clearly very well practised. 💸`,

  (names: string) =>
    `Shoutout to ${names} for treating match fees like optional homework. Legends pay up, the rest just turn up. 🙃`,

  (names: string) =>
    `Finance update: ${names} owe the group money. Their defending is also questionable but we'll deal with one problem at a time. 💀`,

  (names: string) =>
    `${names} — your ability to dodge a payment link is genuinely more impressive than anything you've done on the pitch this season. 🏃`,

  (names: string) =>
    `Payment reminder for ${names}. You showed up, you played, you (probably) lost — now at least win at paying on time. ⚽💸`,

  (names: string) =>
    `The ${names} fan club meeting has been cancelled until they settle their tab. You know who you are. 🚫`,

  (names: string) =>
    `Reminder: ${names} are currently sponsored by "I'll pay next time". Next time is now. 🕐`,

  (names: string) =>
    `Breaking news: ${names} have been officially classified as liabilities — both on the pitch and in the group treasury. 📰`,

  (names: string) =>
    `PSA: ${names} still haven't paid. We love you. We need the money. In that order. ❤️💰`,

  (names: string) =>
    `The squad has been asking questions. ${names}, the squad would like to be paid. The squad is patient. The squad is watching. 👀`,

  (names: string) =>
    `Stat of the week: ${names} — 100% attendance rate, 0% payment rate. Consistency is a virtue but not like this. 📊`,

  (names: string) =>
    `An open letter to ${names}: We know you have the money. We saw you buy that coffee. Pay up. Kind regards, the group. ☕`,

  (names: string) =>
    `This is your captain speaking. ${names}, we have detected your payment is still pending. Please make your way to the cashier at your earliest convenience. Thank you for flying VeloCT. 🛫`,

  (names: string) =>
    `Match fee reminder for ${names}. The group chat will remain awkward until this is resolved. The ball is in your court. Literally. 🏐`,

  (names: string) =>
    `${names}, imagine scoring a last-minute winner and then not paying. That's exactly the energy you're giving right now. Don't be that person. 🥅`,
];

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { players } = body;
  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: 'Select at least one player' }, { status: 400 });
  }

  const names = formatNames(players as string[]);
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const message = template(names);

  return NextResponse.json({ message });
}
