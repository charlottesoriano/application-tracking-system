import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from './Accordion'
import { cn } from '~/lib/utils'

interface Tip {
    type: "good" | "improve";
    tip: string;
    explanation: string;
}

const ScoreBadge = ({ score }: { score: number }) => {
    const isGood = score > 69
    const isOkay = score > 39

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-1 px-2 py-1 rounded-full',
                isGood ? 'bg-positive-bg' : isOkay ? 'bg-caution-bg' : 'bg-danger-bg'
            )}
        >
            <img
                src={isGood ? '/icons/check.svg' : '/icons/warning.svg'}
                alt={isGood ? 'check' : 'warning'}
                className="w-4 h-4"
            />
            <p
                className={cn(
                    'text-sm font-medium',
                    isGood ? 'text-positive' : isOkay ? 'text-caution' : 'text-danger'
                )}
            >
                {score}/100
            </p>
        </div>
    )
}

const CategoryHeader = ({ title, categoryScore }: { title: string, categoryScore: number }) => {
    return (
        <div className="flex flex-row items-center gap-3">
            <p className="text-lg font-display font-bold text-foreground">{title}</p>
            <ScoreBadge score={categoryScore} />
        </div>
    )
}

const CategoryContent = ({ tips }: { tips: Tip[] }) => {
    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-4">
                {tips.map((tip, index) => (
                    <div key={index} className="flex flex-row gap-2 items-center">
                        <img
                            src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'}
                            alt={tip.type === 'good' ? 'check' : 'warning'}
                            className="w-5 h-5"
                        />
                        <p className="text-lg text-foreground">{tip.tip}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                {tips.map((tip, index) => (
                    <div
                        key={index}
                        className={cn(
                            'flex flex-col gap-2 rounded-2xl p-4 border',
                            tip.type === 'good'
                                ? 'bg-positive-bg border-positive-border text-positive'
                                : 'bg-caution-bg border-caution-border text-caution'
                        )}
                    >
                        <div className="flex flex-row gap-2 items-center">
                            <img
                                src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'}
                                alt={tip.type === 'good' ? 'check' : 'warning'}
                                className="w-5 h-5"
                            />
                            <p className="font-semibold">{tip.tip}</p>
                        </div>
                        <p>{tip.explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

const Details = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="flex flex-col gap-4 w-full">
            <Accordion allowMultiple className="w-full">
                <AccordionItem id="tone-style">
                    <AccordionHeader itemId="tone-style">
                        <CategoryHeader title="Tone & Style" categoryScore={feedback.toneAndStyle.score} />
                    </AccordionHeader>
                    <AccordionContent itemId="tone-style">
                        <CategoryContent tips={feedback.toneAndStyle.tips} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem id="content">
                    <AccordionHeader itemId="content">
                        <CategoryHeader title="Content" categoryScore={feedback.content.score} />
                    </AccordionHeader>
                    <AccordionContent itemId="content">
                        <CategoryContent tips={feedback.content.tips} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem id="structure">
                    <AccordionHeader itemId="structure">
                        <CategoryHeader title="Structure" categoryScore={feedback.structure.score} />
                    </AccordionHeader>
                    <AccordionContent itemId="structure">
                        <CategoryContent tips={feedback.structure.tips} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem id="skills">
                    <AccordionHeader itemId="skills">
                        <CategoryHeader title="Skills" categoryScore={feedback.skills.score} />
                    </AccordionHeader>
                    <AccordionContent itemId="skills">
                        <CategoryContent tips={feedback.skills.tips} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export default Details
