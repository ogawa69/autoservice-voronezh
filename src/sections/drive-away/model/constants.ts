import { siteProfile } from "@/content/demo";

export const DRIVE_AWAY_VIDEO = {
  source: "/hero/drive-away-reviews.mp4",
  startPoster: "/hero/drive-away-reviews-poster.jpg",
  emptyPoster: "/hero/drive-away-reviews-empty.jpg",
  startSeconds: 4.15,
  endSeconds: 10,
  scrollEnd: 0.58,
  frameRate: 24,
  frameThreshold: 1 / 48,
  maxRetries: 1,
  retryDelay: 500,
} as const;

export const DRIVE_AWAY_TIMING = {
  reviewHeadingStart: 0.22,
  reviewTitleResetAt: 0.2,
  reviewFirstRowStart: 0.34,
  reviewSecondRowStart: 0.46,
  reviewRowRevealDuration: 0.045,
  reviewExitStart: 0.59,
  reviewTitleExitDuration: 0.026,
  reviewExitStagger: 0.004,
  reviewRowExitDuration: 0.028,
  contactRevealStart: 0.69,
  contactHeadingStart: 0.7,
  contactTitleResetAt: 0.685,
  contactPhoneStart: 0.74,
  contactHoursStart: 0.79,
  contactAddressStart: 0.84,
  contactMapStart: 0.89,
  contactItemDuration: 0.045,
  contactMapDuration: 0.07,
} as const;

export const CONTACT_MAP_DESKTOP_MEDIA_QUERY = "(min-width: 60rem)";
export const CONTACT_MAP_MOBILE_MEDIA_QUERY = "(max-width: 47.999rem)";

export const CONTACT_CONTENT = {
  phoneDisplay: siteProfile.phoneLabel,
  phoneHref: siteProfile.phoneHref,
  address: siteProfile.addressLabel,
  workingHours: siteProfile.workingHours,
  mapScreenshot: siteProfile.mapScreenshot,
  mapPage: siteProfile.mapPage,
} as const;

const reviewTitleExitEnd =
  DRIVE_AWAY_TIMING.reviewExitStart +
  DRIVE_AWAY_TIMING.reviewTitleExitDuration;
const firstRowExitStart =
  reviewTitleExitEnd + DRIVE_AWAY_TIMING.reviewExitStagger;
const secondRowExitStart =
  firstRowExitStart +
  DRIVE_AWAY_TIMING.reviewRowExitDuration +
  DRIVE_AWAY_TIMING.reviewExitStagger;
const rowsExitEnd =
  secondRowExitStart + DRIVE_AWAY_TIMING.reviewRowExitDuration;
const desktopContactEntryStep =
  DRIVE_AWAY_TIMING.contactItemDuration +
  DRIVE_AWAY_TIMING.reviewExitStagger;

export const DRIVE_AWAY_DERIVED_TIMING = {
  reviewTitleExitStart: DRIVE_AWAY_TIMING.reviewExitStart,
  firstRowExitStart,
  secondRowExitStart,
  rowsExitEnd,
  reviewExitEnd: rowsExitEnd,
  reviewMotionStart: DRIVE_AWAY_TIMING.reviewFirstRowStart - 0.015,
  reviewMotionEnd: rowsExitEnd,
  desktopContactHeadingStart: DRIVE_AWAY_TIMING.contactHeadingStart,
  desktopContactHoursStart:
    DRIVE_AWAY_TIMING.contactHeadingStart + desktopContactEntryStep,
  desktopContactPhoneStart:
    DRIVE_AWAY_TIMING.contactHeadingStart + desktopContactEntryStep * 2,
  desktopContactAddressStart:
    DRIVE_AWAY_TIMING.contactHeadingStart + desktopContactEntryStep * 3,
  desktopContactMapStart:
    DRIVE_AWAY_TIMING.contactHeadingStart + desktopContactEntryStep * 4,
} as const;
