/* Ready-to-send WhatsApp messages for customers and drivers. */
import type { Load, Quote } from '../api';
import { COMPANY } from '../config';
import { firstName, fmtDay, money, trackingLink } from '../lib/format';

const lines = (xs: (string | null | false | undefined)[]) => xs.filter(x => x !== null && x !== false && x !== undefined).join('\n');

export function rateMessage(q: Quote, amount: number, currency: string) {
  return lines([
    `Hello ${firstName(q.name)},`, '',
    `Thank you for your quote request ${q.ref} with ${COMPANY.shortName}.`, '',
    `Route: ${q.pickup} to ${q.delivery}`,
    `Cargo: ${q.cargo}${q.weight ? `, ${q.weight} t` : ''}`,
    q.truck && !/not sure/i.test(q.truck) ? `Truck: ${q.truck}` : null,
    q.loadDate ? `Loading: ${fmtDay(q.loadDate, true)}` : null,
    `Rate: ${money(amount, currency)} ${/hire/i.test(q.service) ? 'per day' : 'per load'}`, '',
    'Reply YES to book and we will confirm the truck and driver details.', '',
    COMPANY.name
  ]);
}

export function statusMessage(l: Load) {
  return lines([
    `Hello ${firstName(l.customer)},`, '',
    `Update on your load ${l.ref} (${l.origin} to ${l.destination}):`,
    `${l.status}${l.location ? `, ${l.location}` : ''}${l.publicNote ? `. ${l.publicNote}` : ''}`,
    l.status !== 'Delivered' && l.eta ? `Estimated delivery: ${fmtDay(l.eta, true)}` : null, '',
    `Track it any time: ${trackingLink(l.ref)}`, '',
    COMPANY.shortName
  ]);
}

export function bookingMessage(l: Load) {
  return lines([
    `Hello ${firstName(l.customer)},`, '',
    `Your load ${l.ref} is booked with ${COMPANY.shortName}.`,
    `Route: ${l.origin} to ${l.destination}`,
    l.truckReg ? `Truck: ${l.truckReg}` : null,
    l.driver ? `Driver: ${l.driver}${l.driverPhone ? ` (${l.driverPhone})` : ''}` : null,
    l.loadDate ? `Loading: ${fmtDay(l.loadDate, true)}` : null, '',
    `Track it any time: ${trackingLink(l.ref)}`, '',
    COMPANY.shortName
  ]);
}

export function driverMessage(l: Load) {
  return lines([
    `Load ${l.ref}: ${l.origin} to ${l.destination}`,
    `Customer: ${l.customer || '-'}${l.customerPhone ? ` (${l.customerPhone})` : ''}`,
    `Cargo: ${l.cargo || '-'}${l.weight ? `, ${l.weight} t` : ''}`,
    l.loadDate ? `Loading: ${fmtDay(l.loadDate, true)}` : null,
    'Please send a message at every stop and on delivery with the signed POD.'
  ]);
}
