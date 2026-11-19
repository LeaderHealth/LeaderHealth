import type { ReactNode } from "react";
import type { AgreementQuestionView } from "./agreement-types";

export function AgreementQuestions({
  questions,
  asker,
  waitingText,
  renderReply,
}: {
  questions: AgreementQuestionView[];
  asker: string;
  waitingText: string;
  renderReply?: (question: AgreementQuestionView) => ReactNode;
}) {
  if (questions.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {questions.map((question) => (
        <li key={question.id} className="flex flex-col gap-2 rounded-[18px] border border-[#E8DEDC] bg-white px-4 py-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B5A57]">
              {asker} asked · {question.askedAt}
            </span>
            <p className="whitespace-pre-wrap break-words text-[15px]">{question.text}</p>
          </div>
          {question.reply ? (
            <div className="flex flex-col gap-1 rounded-[14px] bg-[#F7F3F2] px-3.5 py-2.5">
              <span className="text-[13px] text-[#6B5A57]">
                Leader Health replied{question.repliedAt ? ` · ${question.repliedAt}` : ""}
              </span>
              <p className="whitespace-pre-wrap break-words text-[15px]">{question.reply}</p>
            </div>
          ) : renderReply ? (
            renderReply(question)
          ) : (
            <span className="text-[13px] font-medium text-[#7A4E00]">{waitingText}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
