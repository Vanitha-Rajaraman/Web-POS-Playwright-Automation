import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://stage-pos.palletnow.co',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://stage-highway.palletnow.co',
  get mobileNumber(): string {
    return required('MOBILE_NUMBER');
  },
  get pin(): string {
    return required('PIN');
  },
  // Grocery
  orgName: process.env.ORG_NAME ?? 'Twinleaves',
  locationName: process.env.LOCATION_NAME ?? 'Automation Testing',
  // Restaurant (same org, two locations: dine-in and QSR)
  restaurantOrgName: process.env.RESTAURANT_ORG_NAME ?? 'CANTEEN',
  dineInLocationName: process.env.DINEIN_LOCATION_NAME ?? 'Automation Testing Dine In',
  qsrLocationName: process.env.QSR_LOCATION_NAME ?? 'Automation Testing QSR',
};
