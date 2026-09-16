import { gsap } from "gsap";
import {
  DRIVE_AWAY_DERIVED_TIMING,
  DRIVE_AWAY_TIMING,
} from "./constants";

export interface DriveAwayTimelineElements {
  section: HTMLElement;
  reviews: HTMLElement;
  reviewsHeader: HTMLElement;
  reviewsHeadingCopy: HTMLElement;
  firstReviewRow: HTMLElement;
  secondReviewRow: HTMLElement;
  motionToggle: HTMLElement;
  contact: HTMLElement;
  contactHeading: HTMLElement | null;
  contactPhone: HTMLElement;
  contactHours: HTMLElement;
  contactAddress: HTMLElement;
  contactMap: HTMLElement;
}

export type NullableDriveAwayTimelineElements = {
  [Key in keyof DriveAwayTimelineElements]: DriveAwayTimelineElements[Key] | null;
};

interface CreateDriveAwayTimelineOptions {
  elements: DriveAwayTimelineElements;
  desktopContactMapMotion: boolean;
  onProgress: (progress: number) => void;
}

export const clearDriveAwayTimelineStyles = (
  elements: NullableDriveAwayTimelineElements,
) => {
  gsap.set(Object.values(elements).filter(Boolean), { clearProps: "all" });
};

export const createDriveAwayTimeline = ({
  elements,
  desktopContactMapMotion,
  onProgress,
}: CreateDriveAwayTimelineOptions) => {
  const {
    section,
    reviews,
    reviewsHeader,
    reviewsHeadingCopy,
    firstReviewRow,
    secondReviewRow,
    motionToggle,
    contact,
    contactHeading,
    contactPhone,
    contactHours,
    contactAddress,
    contactMap,
  } = elements;

  gsap.set(reviews, {
    autoAlpha: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    pointerEvents: "auto",
    transform: "translateY(0rem)",
  });
  gsap.set(reviewsHeader, { autoAlpha: 1 });
  gsap.set(reviewsHeadingCopy, {
    autoAlpha: 1,
    transform: "translateX(0vw)",
  });
  gsap.set(motionToggle, {
    autoAlpha: 0,
    transform: "translateY(0.5rem)",
  });
  gsap.set([firstReviewRow, secondReviewRow], {
    autoAlpha: 0,
    clipPath: "inset(0% 0% 100% 0%)",
    transform: "translateY(1.5rem)",
  });
  gsap.set(contact, {
    autoAlpha: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    pointerEvents: "none",
    transform: "translateY(0rem)",
  });
  if (desktopContactMapMotion && contactHeading) {
    gsap.set(contactHeading, {
      autoAlpha: 0,
      transform: "translate3d(-12vw, 0, 0)",
    });
  }
  gsap.set([contactPhone, contactAddress], {
    autoAlpha: 0,
    transform: "translate3d(-12vw, 0, 0)",
  });
  gsap.set(contactHours, {
    autoAlpha: 0,
    transform: desktopContactMapMotion
      ? "translate3d(-12vw, 0, 0)"
      : "translate3d(12vw, 0, 0)",
  });
  gsap.set(contactMap, {
    autoAlpha: 0,
    transform: desktopContactMapMotion
      ? "translate3d(12vw, 0, 0)"
      : "translate3d(0, 12svh, 0)",
  });

  const phoneStart = desktopContactMapMotion
    ? DRIVE_AWAY_DERIVED_TIMING.desktopContactPhoneStart
    : DRIVE_AWAY_TIMING.contactPhoneStart;
  const hoursStart = desktopContactMapMotion
    ? DRIVE_AWAY_DERIVED_TIMING.desktopContactHoursStart
    : DRIVE_AWAY_TIMING.contactHoursStart;
  const addressStart = desktopContactMapMotion
    ? DRIVE_AWAY_DERIVED_TIMING.desktopContactAddressStart
    : DRIVE_AWAY_TIMING.contactAddressStart;
  const mapStart = desktopContactMapMotion
    ? DRIVE_AWAY_DERIVED_TIMING.desktopContactMapStart
    : DRIVE_AWAY_TIMING.contactMapStart;
  const mapDuration = desktopContactMapMotion
    ? DRIVE_AWAY_TIMING.contactItemDuration
    : DRIVE_AWAY_TIMING.contactMapDuration;
  const playhead = { progress: 0 };
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.18,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgress(self.progress),
      onRefresh: (self) => onProgress(self.progress),
    },
  });

  if (desktopContactMapMotion && contactHeading) {
    timeline.to(
      contactHeading,
      {
        autoAlpha: 1,
        transform: "translate3d(0, 0, 0)",
        duration: DRIVE_AWAY_TIMING.contactItemDuration,
        ease: "none",
      },
      DRIVE_AWAY_DERIVED_TIMING.desktopContactHeadingStart,
    );
  }

  timeline
    .to(playhead, { progress: 1, duration: 1, ease: "none" }, 0)
    .to(
      firstReviewRow,
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        transform: "translateY(0rem)",
        duration: DRIVE_AWAY_TIMING.reviewRowRevealDuration,
        ease: "power2.inOut",
      },
      DRIVE_AWAY_TIMING.reviewFirstRowStart,
    )
    .to(
      motionToggle,
      {
        autoAlpha: 1,
        transform: "translateY(0rem)",
        duration: DRIVE_AWAY_TIMING.reviewRowRevealDuration,
        ease: "power2.out",
      },
      DRIVE_AWAY_TIMING.reviewFirstRowStart,
    )
    .to(
      secondReviewRow,
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        transform: "translateY(0rem)",
        duration: DRIVE_AWAY_TIMING.reviewRowRevealDuration,
        ease: "power2.inOut",
      },
      DRIVE_AWAY_TIMING.reviewSecondRowStart,
    )
    .to(
      reviewsHeadingCopy,
      {
        autoAlpha: 0,
        transform: "translateX(12vw)",
        duration: DRIVE_AWAY_TIMING.reviewTitleExitDuration,
        ease: "none",
      },
      DRIVE_AWAY_DERIVED_TIMING.reviewTitleExitStart,
    )
    .to(
      motionToggle,
      {
        autoAlpha: 0,
        pointerEvents: "none",
        duration: DRIVE_AWAY_TIMING.reviewTitleExitDuration,
        ease: "none",
      },
      DRIVE_AWAY_TIMING.reviewExitStart,
    )
    .to(
      firstReviewRow,
      {
        autoAlpha: 0,
        clipPath: "inset(100% 0% 0% 0%)",
        transform: "translateY(1.5rem)",
        duration: DRIVE_AWAY_TIMING.reviewRowExitDuration,
        ease: "none",
      },
      DRIVE_AWAY_DERIVED_TIMING.firstRowExitStart,
    )
    .to(
      secondReviewRow,
      {
        autoAlpha: 0,
        clipPath: "inset(100% 0% 0% 0%)",
        transform: "translateY(1.5rem)",
        duration: DRIVE_AWAY_TIMING.reviewRowExitDuration,
        ease: "none",
      },
      DRIVE_AWAY_DERIVED_TIMING.secondRowExitStart,
    )
    .set(
      reviews,
      { autoAlpha: 0, pointerEvents: "none" },
      DRIVE_AWAY_DERIVED_TIMING.reviewExitEnd,
    )
    .set(
      contact,
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        pointerEvents: "auto",
        transform: "translateY(0rem)",
      },
      DRIVE_AWAY_TIMING.contactRevealStart,
    );

  const contactEntries: Array<[HTMLElement, number]> = [
    [contactPhone, phoneStart],
    [contactHours, hoursStart],
    [contactAddress, addressStart],
  ];
  contactEntries.forEach(([element, start]) => {
    timeline.to(
      element,
      {
        autoAlpha: 1,
        transform: "translate3d(0, 0, 0)",
        duration: DRIVE_AWAY_TIMING.contactItemDuration,
        ease: "none",
      },
      start,
    );
  });
  timeline.to(
    contactMap,
    {
      autoAlpha: 1,
      transform: "translate3d(0, 0, 0)",
      duration: mapDuration,
      ease: "none",
    },
    mapStart,
  );

  return timeline;
};
