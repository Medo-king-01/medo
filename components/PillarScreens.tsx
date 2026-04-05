
import React from 'react';
import { PillarDetailScreen } from './PillarDetailScreen';
import { DailyQuestWidget } from './DailyQuestWidget';

interface ScreenProps {
    onBack: () => void;
    onAddTask: () => void;
}

// Wrapper to inject Daily Quest into Exercise
const ExerciseScreenWrapper: React.FC<ScreenProps> = (props) => {
    return (
        <div className="relative h-full flex flex-col">
            <PillarDetailScreen pillarId="Exercise" {...props} />
            {/* We render the Daily Quest Widget absolutely positioned or injected via portal? 
                Actually, simpler to modify PillarDetailScreen, but for minimal intrusion,
                let's put it on top if PillarDetail supports children, 
                or just create a specialized structure.
                
                Better: The PillarDetailScreen is generic. Let's make a custom view for Exercise that USES PillarDetailScreen logic
                but renders differently. 
                
                For now, let's overlay it at the top of the list in PillarDetailScreen via a 'headerContent' prop approach 
                (which would require changing PillarDetailScreen), 
                OR just put it absolutely on top of the list area if possible.
                
                Simplest Cleanest Way: Render it here, but we need to integrate it into the scroll view.
                Since PillarDetailScreen controls the scrollview, we can't easily inject it without modifying that component.
            */}
        </div>
    );
};

// Re-writing PillarDetailScreen to accept optional header content to support this cleanly
export const LearningScreen: React.FC<ScreenProps> = (props) => <PillarDetailScreen pillarId="Learning" {...props} />;
export const StudyingScreen: React.FC<ScreenProps> = (props) => <PillarDetailScreen pillarId="Studying" {...props} />;
export const ExerciseScreen: React.FC<ScreenProps> = (props) => (
    <PillarDetailScreen 
        pillarId="Exercise" 
        {...props} 
        customHeader={<DailyQuestWidget />}
    />
);
export const WorkScreen: React.FC<ScreenProps> = (props) => <PillarDetailScreen pillarId="Work" {...props} />;
export const EntertainmentScreen: React.FC<ScreenProps> = (props) => <PillarDetailScreen pillarId="Entertainment" {...props} />;
export const QuranScreen: React.FC<ScreenProps> = (props) => <PillarDetailScreen pillarId="Quran" {...props} />;
