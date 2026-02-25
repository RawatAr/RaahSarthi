import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Flag, Mic, LocateFixed, ArrowUpDown, Search, Loader2 } from 'lucide-react';
import { geocodeAddress } from '../utils/api';

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/* ── Autocomplete Input ── */
function AutocompleteInput({ placeholder, IconComponent, iconColor, value, onChange, onSelect, inputRef: externalRef, id }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const inputRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (externalRef) externalRef.current = inputRef.current;
    }, [externalRef]);

    const doSearch = useCallback(
        debounce(async (query) => {
            if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
            try {
                const results = await geocodeAddress(query);
                setSuggestions(results);
                setShowDropdown(results.length > 0);
                setHighlightIdx(-1);
            } catch { setSuggestions([]); }
        }, 350),
        []
    );

    useEffect(() => {
        if (showDropdown && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
    }, [showDropdown, suggestions]);

    useEffect(() => {
        const handler = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setTimeout(() => setShowDropdown(false), 150);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectItem = (item) => {
        onChange(item.display_name);
        setSuggestions([]);
        setShowDropdown(false);
        setHighlightIdx(-1);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) {
            if (e.key === 'Enter') onSelect();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIdx >= 0 && suggestions[highlightIdx]) {
                selectItem(suggestions[highlightIdx]);
            } else {
                setShowDropdown(false);
                onSelect();
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const dropdown = showDropdown && suggestions.length > 0 ? createPortal(
        <div
            className="autocomplete-dropdown"
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
        >
            {suggestions.map((s, i) => (
                <div
                    key={i}
                    className={`autocomplete-item ${i === highlightIdx ? 'highlighted' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); selectItem(s); }}
                    onMouseEnter={() => setHighlightIdx(i)}
                >
                    <MapPin size={13} color="#9AA0A6" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span className="autocomplete-text">{s.display_name}</span>
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div className="search-input-card">
            <div className="search-input-icon">
                <IconComponent size={15} color={iconColor} strokeWidth={2.5} />
            </div>
            <input
                id={id}
                ref={inputRef}
                className="search-input-field"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    doSearch(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
            />
            {value && (
                <button
                    className="search-input-clear"
                    onClick={() => { onChange(''); setSuggestions([]); setShowDropdown(false); }}
                    tabIndex={-1}
                >×</button>
            )}
            {dropdown}
        </div>
    );
}

/* ── Voice search hook ── */
function useVoiceSearch(onResult) {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Voice search not supported in this browser.'); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (e) => { onResult(e.results[0][0].transcript); setListening(false); };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognition.start();
        recognitionRef.current = recognition;
        setListening(true);
    }, [onResult]);

    return { listening, startListening };
}

/* ── Main Component ── */
export default function SearchPanel({ onSearch, loading }) {
    const [origin, setOrigin] = useState('');
    const [dest, setDest] = useState('');
    const originRef = useRef(null);
    const destRef = useRef(null);

    const voiceOrigin = useVoiceSearch(setOrigin);
    const voiceDest = useVoiceSearch(setDest);

    const handleSearch = () => {
        if (!origin.trim() || !dest.trim()) return;
        onSearch(origin.trim(), dest.trim());
    };

    const handleSwap = () => {
        setOrigin(dest);
        setDest(origin);
    };

    // Keyboard shortcut: Ctrl+K focuses origin
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                originRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className="search-panel">
            {/* Origin input */}
            <div className="search-row">
                <div className="search-input-wrapper">
                    <AutocompleteInput
                        id="search-origin"
                        placeholder="From — Starting point…"
                        IconComponent={MapPin}
                        iconColor="#10B981"
                        value={origin}
                        onChange={setOrigin}
                        onSelect={handleSearch}
                        inputRef={originRef}
                    />
                </div>
                <button
                    className="search-voice-btn"
                    onClick={voiceOrigin.startListening}
                    disabled={voiceOrigin.listening}
                    title="Voice search for origin"
                >
                    <Mic size={13} strokeWidth={2} color={voiceOrigin.listening ? '#EF4444' : 'var(--text-muted)'} />
                </button>
            </div>

            {/* Swap + connector */}
            <div className="search-connector">
                <div className="search-connector-line" />
                <button className="search-swap-btn" onClick={handleSwap} title="Swap origin & destination">
                    <ArrowUpDown size={14} strokeWidth={2.5} />
                </button>
                <div className="search-connector-line" />
            </div>

            {/* Destination input */}
            <div className="search-row">
                <div className="search-input-wrapper">
                    <AutocompleteInput
                        id="search-dest"
                        placeholder="To — Destination…"
                        IconComponent={Flag}
                        iconColor="#F7941D"
                        value={dest}
                        onChange={setDest}
                        onSelect={handleSearch}
                        inputRef={destRef}
                    />
                </div>
                <button
                    className="search-voice-btn"
                    onClick={voiceDest.startListening}
                    disabled={voiceDest.listening}
                    title="Voice search for destination"
                >
                    <Mic size={13} strokeWidth={2} color={voiceDest.listening ? '#EF4444' : 'var(--text-muted)'} />
                </button>
            </div>

            {/* Search button */}
            <button
                className="btn btn-primary search-btn"
                onClick={handleSearch}
                disabled={loading || !origin.trim() || !dest.trim()}
            >
                {loading
                    ? <><Loader2 size={15} strokeWidth={2} className="spin-icon" /> Calculating…</>
                    : <><Search size={15} strokeWidth={2.5} /> Find Route & Stops</>
                }
            </button>

            <div className="search-hint">
                <kbd>Ctrl</kbd><kbd>K</kbd> to focus · <kbd>Enter</kbd> to search
            </div>
        </div>
    );
}
