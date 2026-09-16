import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  clearDriveAwayTimelineStyles,
  createDriveAwayTimeline,
  type DriveAwayTimelineElements,
  type NullableDriveAwayTimelineElements,
} from "../model/createDriveAwayTimeline";
import { createTitleRevealSync } from "../model/createTitleRevealSync";
import {
  DRIVE_AWAY_DERIVED_TIMING,
  DRIVE_AWAY_TIMING,
} from "../model/constants";
import type {
  ElementRef,
  RevealControllerRef,
  VideoProgressController,
} from "../types";
import type { MutableRefObject } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface UseDriveAwayTimelineOptions {
  sectionRef: ElementRef<HTMLElement>;
  reviewsRef: ElementRef;
  reviewsHeaderRef: ElementRef<HTMLElement>;
  reviewsHeadingCopyRef: ElementRef;
  reviewsTitleRef: RevealControllerRef;
  firstReviewRowRef: ElementRef;
  secondReviewRowRef: ElementRef;
  motionToggleRef: ElementRef<HTMLButtonElement>;
  contactRef: ElementRef;
  contactHeadingRef: ElementRef;
  contactPhoneRef: ElementRef;
  contactHoursRef: ElementRef;
  contactAddressRef: ElementRef;
  contactMapRef: ElementRef;
  contactTitleRef: RevealControllerRef;
  storyProgressRef: MutableRefObject<number>;
  videoControllerRef: MutableRefObject<VideoProgressController | null>;
  reduceMotion: boolean;
  desktopContactMapMotion: boolean;
}

export const useDriveAwayTimeline = ({
  sectionRef,
  reviewsRef,
  reviewsHeaderRef,
  reviewsHeadingCopyRef,
  reviewsTitleRef,
  firstReviewRowRef,
  secondReviewRowRef,
  motionToggleRef,
  contactRef,
  contactHeadingRef,
  contactPhoneRef,
  contactHoursRef,
  contactAddressRef,
  contactMapRef,
  contactTitleRef,
  storyProgressRef,
  videoControllerRef,
  reduceMotion,
  desktopContactMapMotion,
}: UseDriveAwayTimelineOptions) => {
  const contactActiveRef = useRef(false);
  const reviewMotionActiveRef = useRef(false);
  const [contactActive, setContactActive] = useState(false);
  const [reviewMotionActive, setReviewMotionActive] = useState(false);

  useGSAP(
    () => {
      const elements: NullableDriveAwayTimelineElements = {
        section: sectionRef.current,
        reviews: reviewsRef.current,
        reviewsHeader: reviewsHeaderRef.current,
        reviewsHeadingCopy: reviewsHeadingCopyRef.current,
        firstReviewRow: firstReviewRowRef.current,
        secondReviewRow: secondReviewRowRef.current,
        motionToggle: motionToggleRef.current,
        contact: contactRef.current,
        contactHeading: contactHeadingRef.current,
        contactPhone: contactPhoneRef.current,
        contactHours: contactHoursRef.current,
        contactAddress: contactAddressRef.current,
        contactMap: contactMapRef.current,
      };
      const required = [
        elements.section,
        elements.reviews,
        elements.reviewsHeader,
        elements.reviewsHeadingCopy,
        elements.contact,
      ];
      const animatedRequired = [
        elements.firstReviewRow,
        elements.secondReviewRow,
        elements.motionToggle,
        elements.contactPhone,
        elements.contactHours,
        elements.contactAddress,
        elements.contactMap,
        desktopContactMapMotion ? elements.contactHeading : true,
      ];
      if (
        required.some((element) => !element) ||
        (!reduceMotion && animatedRequired.some((element) => !element))
      ) {
        return undefined;
      }

      const updateContactPhase = (active: boolean) => {
        if (contactActiveRef.current === active) return;
        contactActiveRef.current = active;
        setContactActive(active);
      };
      const updateReviewMotionPhase = (active: boolean) => {
        if (reviewMotionActiveRef.current === active) return;
        reviewMotionActiveRef.current = active;
        setReviewMotionActive(active);
      };

      if (reduceMotion) {
        clearDriveAwayTimelineStyles(elements);
        updateContactPhase(true);
        updateReviewMotionPhase(false);
        return undefined;
      }

      updateContactPhase(false);
      updateReviewMotionPhase(false);
      const reviewsTitle = createTitleRevealSync({
        controllerRef: reviewsTitleRef,
        startAt: DRIVE_AWAY_TIMING.reviewHeadingStart,
        resetAt: DRIVE_AWAY_TIMING.reviewTitleResetAt,
      });
      const contactTitle = createTitleRevealSync({
        controllerRef: contactTitleRef,
        startAt: DRIVE_AWAY_TIMING.contactHeadingStart,
        resetAt: DRIVE_AWAY_TIMING.contactTitleResetAt,
      });
      const contactContentStart = desktopContactMapMotion
        ? DRIVE_AWAY_DERIVED_TIMING.desktopContactHoursStart
        : DRIVE_AWAY_TIMING.contactPhoneStart;
      const shouldShowContactContent = (progress: number) =>
        contactActiveRef.current
          ? progress > DRIVE_AWAY_TIMING.contactRevealStart
          : progress >= contactContentStart;
      const onProgress = (progress: number) => {
        storyProgressRef.current = progress;
        videoControllerRef.current?.(progress);
        reviewsTitle.sync(progress);
        contactTitle.sync(progress);
        updateContactPhase(shouldShowContactContent(progress));
        updateReviewMotionPhase(
          progress >= DRIVE_AWAY_DERIVED_TIMING.reviewMotionStart &&
            progress <= DRIVE_AWAY_DERIVED_TIMING.reviewMotionEnd,
        );
      };
      const timeline = createDriveAwayTimeline({
        elements: elements as DriveAwayTimelineElements,
        desktopContactMapMotion,
        onProgress,
      });

      return () => {
        reviewsTitle.destroy();
        contactTitle.destroy();
        updateContactPhase(false);
        updateReviewMotionPhase(false);
        timeline.kill();
      };
    },
    {
      scope: sectionRef,
      dependencies: [reduceMotion, desktopContactMapMotion],
      revertOnUpdate: true,
    },
  );

  return { contactActive, reviewMotionActive };
};
