import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Scale, Ruler, Droplets, BedDouble, Activity, Briefcase,
  Dumbbell, Heart, Pill, Scissors, Users, Target, Apple, Save,
  X, Check, AlertTriangle, Loader2, Edit2, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { getHealthProfile, updateHealthProfile } from '../utils/healthProfileApi';

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const EXERCISE_FREQUENCIES = ['Never', '1-2 days/week', '3-4 days/week', '5-6 days/week', 'Every day'];
const DIET_TYPES = ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Other'];
const HEALTH_GOALS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: '⚖️' },
  { id: 'gain_weight', label: 'Gain Weight', icon: '📈' },
  { id: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { id: 'improve_fitness', label: 'Improve Fitness', icon: '🏃' },
  { id: 'better_sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'reduce_stress', label: 'Reduce Stress', icon: '🧘' },
  { id: 'healthy_eating', label: 'Healthy Eating', icon: '🥗' },
  { id: 'heart_health', label: 'Heart Health', icon: '❤️' },
  { id: 'more_water', label: 'More Water', icon: '💧' },
  { id: 'improve_stamina', label: 'Improve Stamina', icon: '⚡' }
];

// ─── Helper Components ─────────────────────────────────────────────────────────

function FieldRow({ label, children, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadValue({ value, fallback = '—' }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-sm text-slate-500 italic">{fallback}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map(v => (
          <span key={v} className="px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 text-xs font-medium">{v}</span>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-slate-200 font-medium">{value}</span>;
}

function TextInput({ value, onChange, type = 'text', placeholder, min, max, step }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min} max={max} step={step}
      className="w-full px-3 py-2 text-sm bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/20 rounded-lg text-slate-100 placeholder-slate-500 outline-none transition-all"
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/20 rounded-lg text-slate-100 outline-none transition-all appearance-none cursor-pointer"
    >
      <option value="" className="bg-slate-900">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
    </select>
  );
}

function TagsEdit({ tags, onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('');
  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setInput('');
  };
  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-300 text-[11px] font-semibold">
              {t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-rose-400 transition-colors"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder}
          list={`suggestions-${placeholder}`}
          className="flex-1 px-3 py-2 text-sm bg-slate-800/60 border border-slate-700 hover:border-slate-600 focus:border-sky-500/70 rounded-lg text-slate-100 placeholder-slate-500 outline-none transition-all"
        />
        {suggestions.length > 0 && (
          <datalist id={`suggestions-${placeholder}`}>
            {suggestions.filter(s => !tags.includes(s)).map(s => <option key={s} value={s} />)}
          </datalist>
        )}
        <button
          onClick={() => addTag(input)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-bold transition-all"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Section Component ─────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-sm font-bold text-slate-200">
          <Icon className="h-4 w-4 text-sky-400" />
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-900/40">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Metric Badge ──────────────────────────────────────────────────────────────

function MetricBadge({ label, value, unit, color = 'sky' }) {
  const colors = {
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
  };
  if (!value) return null;
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-xl border ${colors[color]}`}>
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
      {unit && <div className="text-[9px] opacity-50">{unit}</div>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HealthProfileSettings({ onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const data = await getHealthProfile();
      setProfile(data.profile);
      setEditData(data.profile);
    } catch (err) {
      setFetchError(err.message || 'Failed to load health profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Warn on unsaved changes when leaving page
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  const handleEdit = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setHasUnsaved(true);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleCancel = () => {
    if (hasUnsaved && !window.confirm('Discard unsaved changes?')) return;
    setEditData(profile);
    setIsEditing(false);
    setHasUnsaved(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      // Only send changed fields
      const updates = {};
      const fields = [
        'fullName', 'age', 'dateOfBirth', 'gender', 'heightCm', 'weightKg', 'bloodGroup',
        'activityLevel', 'occupation', 'dailyWorkingHours', 'exerciseFrequency', 'sleepHours', 'wakeTime', 'bedtime', 'waterIntakeLiters',
        'medicalConditions', 'allergies', 'currentMedications', 'previousSurgeries', 'familyHistory', 'disabilities',
        'healthGoals', 'dietType', 'foodAllergies', 'cuisinePreference', 'foodsLiked', 'foodsToAvoid'
      ];
      fields.forEach(f => {
        if (JSON.stringify(editData[f]) !== JSON.stringify(profile[f])) {
          updates[f] = editData[f];
        }
      });

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        setHasUnsaved(false);
        return;
      }

      const result = await updateHealthProfile(updates);
      setProfile(result.profile);
      setEditData(result.profile);
      setIsEditing(false);
      setHasUnsaved(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Notify parent (Dashboard) to refresh
      if (onProfileUpdate) onProfileUpdate(result.profile, result.computedMetrics);

      // Update localStorage
      localStorage.setItem('healthProfile', JSON.stringify(result.profile));

    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading health profile...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-400">{fetchError}</p>
          <button onClick={loadProfile} className="text-xs text-sky-400 hover:text-sky-300 underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!profile || !editData) return null;

  const data = isEditing ? editData : profile;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with computed metrics */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Health Profile
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Your personal health information — the foundation of all MediGrid features.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsaved && isEditing && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full animate-pulse">
              Unsaved changes
            </span>
          )}
          {saveSuccess && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved!
            </span>
          )}
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-all"
            >
              <Edit2 className="h-3 w-3" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition-all disabled:opacity-60 shadow-md shadow-sky-500/20"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {saveError}
        </div>
      )}

      {/* Computed Metrics Summary */}
      {profile.bmi && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          <MetricBadge label="BMI" value={profile.bmi} unit={profile.bmiCategory} color={profile.bmiCategory === 'Normal weight' ? 'emerald' : 'amber'} />
          <MetricBadge label="Water Goal" value={profile.dailyWaterGoalLiters ? `${profile.dailyWaterGoalLiters}L` : null} unit="per day" color="sky" />
          <MetricBadge label="Calories" value={profile.dailyCalorieEstimate ? `${profile.dailyCalorieEstimate.toLocaleString()}` : null} unit="kcal / day" color="purple" />
          <MetricBadge label="Health Score" value={profile.initialHealthScore} unit="out of 100" color="emerald" />
        </div>
      )}

      {/* ── Section 1: Personal Information ── */}
      <Section title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldRow label="Full Name" icon={User}>
              {isEditing
                ? <TextInput value={editData.fullName} onChange={v => handleEdit('fullName', v)} placeholder="Your full name" />
                : <ReadValue value={profile.fullName} />}
            </FieldRow>
          </div>
          <FieldRow label="Age">
            {isEditing
              ? <TextInput type="number" value={editData.age} onChange={v => handleEdit('age', v)} placeholder="28" min="1" max="120" />
              : <ReadValue value={profile.age} />}
          </FieldRow>
          <FieldRow label="Gender">
            {isEditing
              ? <SelectInput value={editData.gender} onChange={v => handleEdit('gender', v)} options={GENDERS} placeholder="Select" />
              : <ReadValue value={profile.gender} />}
          </FieldRow>
          <FieldRow label="Height (cm)" icon={Ruler}>
            {isEditing
              ? <TextInput type="number" value={editData.heightCm} onChange={v => handleEdit('heightCm', v)} placeholder="170" min="50" max="300" />
              : <ReadValue value={profile.heightCm ? `${profile.heightCm} cm` : null} />}
          </FieldRow>
          <FieldRow label="Weight (kg)" icon={Scale}>
            {isEditing
              ? <TextInput type="number" value={editData.weightKg} onChange={v => handleEdit('weightKg', v)} placeholder="70" min="10" max="500" step="0.1" />
              : <ReadValue value={profile.weightKg ? `${profile.weightKg} kg` : null} />}
          </FieldRow>
          <FieldRow label="Blood Group">
            {isEditing
              ? <SelectInput value={editData.bloodGroup} onChange={v => handleEdit('bloodGroup', v)} options={BLOOD_GROUPS} placeholder="Select" />
              : <ReadValue value={profile.bloodGroup} />}
          </FieldRow>
          <FieldRow label="Date of Birth">
            {isEditing
              ? <TextInput type="date" value={editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : ''} onChange={v => handleEdit('dateOfBirth', v)} />
              : <ReadValue value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null} />}
          </FieldRow>
        </div>
      </Section>

      {/* ── Section 2: Lifestyle ── */}
      <Section title="Lifestyle" icon={Activity}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldRow label="Activity Level" icon={Activity}>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => handleEdit('activityLevel', level)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        editData.activityLevel === level
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-slate-700/40 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              ) : <ReadValue value={profile.activityLevel} />}
            </FieldRow>
          </div>
          <FieldRow label="Occupation" icon={Briefcase}>
            {isEditing
              ? <TextInput value={editData.occupation} onChange={v => handleEdit('occupation', v)} placeholder="Occupation" />
              : <ReadValue value={profile.occupation} />}
          </FieldRow>
          <FieldRow label="Daily Working Hours">
            {isEditing
              ? <TextInput type="number" value={editData.dailyWorkingHours} onChange={v => handleEdit('dailyWorkingHours', v)} placeholder="8" min="0" max="24" />
              : <ReadValue value={profile.dailyWorkingHours ? `${profile.dailyWorkingHours} hrs` : null} />}
          </FieldRow>
          <FieldRow label="Exercise Frequency" icon={Dumbbell}>
            {isEditing
              ? <SelectInput value={editData.exerciseFrequency} onChange={v => handleEdit('exerciseFrequency', v)} options={EXERCISE_FREQUENCIES} placeholder="Select" />
              : <ReadValue value={profile.exerciseFrequency} />}
          </FieldRow>
          <FieldRow label="Sleep Hours" icon={BedDouble}>
            {isEditing
              ? <TextInput type="number" value={editData.sleepHours} onChange={v => handleEdit('sleepHours', v)} placeholder="8" min="0" max="24" step="0.5" />
              : <ReadValue value={profile.sleepHours ? `${profile.sleepHours} hrs/night` : null} />}
          </FieldRow>
          <FieldRow label="Wake-up Time">
            {isEditing
              ? <TextInput type="time" value={editData.wakeTime} onChange={v => handleEdit('wakeTime', v)} />
              : <ReadValue value={profile.wakeTime} />}
          </FieldRow>
          <FieldRow label="Bedtime">
            {isEditing
              ? <TextInput type="time" value={editData.bedtime} onChange={v => handleEdit('bedtime', v)} />
              : <ReadValue value={profile.bedtime} />}
          </FieldRow>
          <FieldRow label="Daily Water Intake (L)" icon={Droplets}>
            {isEditing
              ? <TextInput type="number" value={editData.waterIntakeLiters} onChange={v => handleEdit('waterIntakeLiters', v)} placeholder="2.5" min="0" max="20" step="0.1" />
              : <ReadValue value={profile.waterIntakeLiters ? `${profile.waterIntakeLiters} L` : null} />}
          </FieldRow>
        </div>
      </Section>

      {/* ── Section 3: Medical Information ── */}
      <Section title="Medical Information" icon={Heart}>
        <div className="flex flex-col gap-4">
          <FieldRow label="Medical Conditions" icon={Heart}>
            {isEditing
              ? <TagsEdit tags={editData.medicalConditions || []} onChange={v => handleEdit('medicalConditions', v)} placeholder="Type and press Enter..." />
              : <ReadValue value={profile.medicalConditions} fallback="None recorded" />}
          </FieldRow>
          <FieldRow label="Allergies" icon={AlertTriangle}>
            {isEditing
              ? <TagsEdit tags={editData.allergies || []} onChange={v => handleEdit('allergies', v)} placeholder="Type and press Enter..." />
              : <ReadValue value={profile.allergies} fallback="None recorded" />}
          </FieldRow>
          <FieldRow label="Current Medications" icon={Pill}>
            {isEditing
              ? <TagsEdit tags={editData.currentMedications || []} onChange={v => handleEdit('currentMedications', v)} placeholder="Type and press Enter..." />
              : <ReadValue value={profile.currentMedications} fallback="None" />}
          </FieldRow>
          <FieldRow label="Previous Surgeries" icon={Scissors}>
            {isEditing
              ? <TagsEdit tags={editData.previousSurgeries || []} onChange={v => handleEdit('previousSurgeries', v)} placeholder="Type and press Enter..." />
              : <ReadValue value={profile.previousSurgeries} fallback="None" />}
          </FieldRow>
          <FieldRow label="Family Medical History" icon={Users}>
            {isEditing
              ? <TagsEdit tags={editData.familyHistory || []} onChange={v => handleEdit('familyHistory', v)} placeholder="E.g. Diabetes (Father)..." />
              : <ReadValue value={profile.familyHistory} fallback="None recorded" />}
          </FieldRow>
        </div>
      </Section>

      {/* ── Section 4: Goals & Diet ── */}
      <Section title="Goals & Diet Preferences" icon={Target}>
        <div className="flex flex-col gap-4">
          <FieldRow label="Health Goals" icon={Target}>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {HEALTH_GOALS.map(g => {
                  const selected = (editData.healthGoals || []).includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        const cur = editData.healthGoals || [];
                        handleEdit('healthGoals', selected ? cur.filter(x => x !== g.id) : [...cur, g.id]);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-slate-700/40 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {g.icon} {g.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <ReadValue
                value={
                  (profile.healthGoals || []).length > 0
                    ? (profile.healthGoals || []).map(id => HEALTH_GOALS.find(g => g.id === id)?.label || id)
                    : null
                }
                fallback="No goals set"
              />
            )}
          </FieldRow>
          <FieldRow label="Diet Type" icon={Apple}>
            {isEditing
              ? <SelectInput value={editData.dietType} onChange={v => handleEdit('dietType', v)} options={DIET_TYPES} placeholder="Select" />
              : <ReadValue value={profile.dietType} />}
          </FieldRow>
          <FieldRow label="Foods to Avoid">
            {isEditing
              ? <TagsEdit tags={editData.foodsToAvoid || []} onChange={v => handleEdit('foodsToAvoid', v)} placeholder="E.g. Deep fried food..." />
              : <ReadValue value={profile.foodsToAvoid} fallback="None specified" />}
          </FieldRow>
          <FieldRow label="Foods You Like">
            {isEditing
              ? <TagsEdit tags={editData.foodsLiked || []} onChange={v => handleEdit('foodsLiked', v)} placeholder="E.g. Grilled chicken..." />
              : <ReadValue value={profile.foodsLiked} fallback="None specified" />}
          </FieldRow>
        </div>
      </Section>

      {/* Not yet onboarded warning */}
      {!profile.onboardingCompleted && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-300">Health Profile Incomplete</p>
            <p className="text-[11px] text-amber-400/70 mt-0.5">Complete your onboarding to unlock personalized health insights and AI-powered recommendations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
