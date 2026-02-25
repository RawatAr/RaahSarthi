export default function BreakSuggestions({ suggestions, onSuggestFilter }) {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="break-suggestions fade-in">
            {suggestions.map((s, i) => (
                <div
                    key={i}
                    className="suggestion-card"
                    onClick={() => onSuggestFilter(s.category)}
                    title={`Click to search for ${s.category} stops`}
                >
                    <div className="suggestion-icon">{s.icon}</div>
                    <div className="suggestion-body">
                        <div className="suggestion-title">{s.title}</div>
                        <div className="suggestion-reason">{s.reason}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
