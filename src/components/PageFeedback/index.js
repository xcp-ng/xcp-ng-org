import React, {useEffect, useId, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Labels must match the choice labels of the "XCP-ng Docs page feedback"
// survey in Formbricks.
const REASONS = [
  'Outdated',
  'Unclear or confusing',
  'Missing information',
  'Inaccurate',
];

// Mirror feedback into Matomo so quality signals can be crossed with
// traffic data, e.g. thumbs-down per view. Only once matomo.js has
// replaced the plain _paq array, i.e. once the visitor has consented —
// never queue events that would be flushed retroactively on consent.
const trackFeedbackEvent = (action, page) => {
  if (window._paq && !Array.isArray(window._paq)) {
    window._paq.push(['trackEvent', 'doc_feedback', action, page]);
  }
};

export default function PageFeedback() {
  const {siteConfig} = useDocusaurusContext();
  const formbricks = siteConfig.customFields?.formbricks;
  const {pathname} = useLocation();

  if (!formbricks?.environmentId) {
    return null;
  }

  return <FeedbackForm key={pathname} formbricks={formbricks} pathname={pathname} />;
}

function FeedbackForm({formbricks, pathname}) {
  const [step, setStep] = useState('vote');
  const [reasons, setReasons] = useState([]);
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const emailId = useId();
  const active = useRef(true);
  const responseId = useRef(null);
  const votePending = useRef(null);
  const request = useRef(null);
  const trackedVote = useRef(null);

  // Each page gets its own form and response. Abort any request when leaving it.
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, []);

  const send = async (value, finished, includeDetails = false) => {
    const base = `${formbricks.apiHost}/api/v1/client/${formbricks.environmentId}/responses`;
    const id = responseId.current;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(id ? `${base}/${id}` : base, {
        method: id ? 'PUT' : 'POST',
        signal: controller.signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...(!id
            ? {surveyId: formbricks.surveyId, meta: {url: window.location.href}}
            : {}),
          finished,
          data: {
            vote: value,
            page: pathname,
            ...(includeDetails ? {
              ...(reasons.length > 0 ? {reason: reasons} : {}),
              ...(details.trim() ? {details: details.trim()} : {}),
              ...(email.trim() ? {email: email.trim()} : {}),
            } : {}),
          },
        }),
      });
      if (!res.ok) return false;
      if (!id) {
        const json = await res.json();
        if (!json?.data?.id) return false;
        responseId.current = json.data.id;
      }
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  };

  const vote = async (value) => {
    setError(false);
    if (trackedVote.current !== value) {
      trackFeedbackEvent(value === 'Yes' ? 'up' : 'down', pathname);
      trackedVote.current = value;
    }
    // Save the vote even if the visitor leaves without completing the follow-up.
    votePending.current = send(value, value === 'Yes');
    if (value === 'No') {
      setStep('why');
      return;
    }
    setSending(true);
    const saved = await votePending.current;
    if (!active.current) return;
    setSending(false);
    if (saved) setStep('done');
    else setError(true);
  };

  const finish = async (includeDetails) => {
    setSending(true);
    setError(false);
    // Wait for the vote so that follow-up details update the same response.
    await votePending.current;
    if (!active.current) return;
    const saved = await send('No', true, includeDetails);
    if (!active.current) return;
    setSending(false);
    if (saved) {
      if (includeDetails) {
        reasons.forEach((reason) => trackFeedbackEvent(`reason:${reason}`, pathname));
      }
      setEmail('');
      setStep('done');
    } else {
      setError(true);
    }
  };

  const submitWhy = (event) => {
    event.preventDefault();
    void finish(true);
  };

  const toggleReason = (reason) =>
    setReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );

  return (
    <div className={styles.feedback}>
      {step === 'vote' && (
        <div className={styles.voteRow}>
          <span className={styles.question}>Was this page helpful?</span>
          <button
            type="button"
            className={styles.voteButton}
            disabled={sending}
            onClick={() => vote('Yes')}>
            <ThumbIcon /> Yes
          </button>
          <button
            type="button"
            className={styles.voteButton}
            disabled={sending}
            onClick={() => vote('No')}>
            <ThumbIcon down /> No
          </button>
        </div>
      )}

      {step === 'why' && (
        <form className={styles.why} onSubmit={submitWhy}>
          <span className={styles.question}>
            Sorry about that. What was the problem?
          </span>
          <div className={styles.reasons}>
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={styles.reason}
                aria-pressed={reasons.includes(reason)}
                disabled={sending}
                onClick={() => toggleReason(reason)}>
                {reason}
              </button>
            ))}
          </div>
          <textarea
            className={styles.details}
            disabled={sending}
            aria-label="Additional details"
            rows={3}
            placeholder="Tell us what's wrong or missing... (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div className={styles.followUp}>
            <label htmlFor={emailId}>Want a follow-up? (optional)</label>
            <input
              id={emailId}
              className={styles.email}
              type="email"
              name="email"
              autoComplete="email"
              aria-describedby={`${emailId}-help`}
              placeholder="Email address"
              maxLength={254}
              value={email}
              disabled={sending}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small id={`${emailId}-help`}>
              We&apos;ll only use this to ask about your feedback or let you know when
              it&apos;s addressed.
            </small>
          </div>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submit}
              disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              className={styles.skip}
              disabled={sending}
              onClick={() => void finish(false)}>
              Skip
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className={styles.error} role="alert">
          We couldn&apos;t send your feedback. Please try again.
        </p>
      )}

      {step === 'done' && (
        <span className={styles.thanks}>Thanks for your feedback!</span>
      )}
    </div>
  );
}

function ThumbIcon({down = false}) {
  return (
    <svg
      className={down ? styles.thumbDown : undefined}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
