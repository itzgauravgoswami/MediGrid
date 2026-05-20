import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, User, Activity, Heart, Target,
  Utensils, Sparkles, Loader2, Sun, Moon, Scale, Ruler, Droplets,
  Clock, Briefcase, Dumbbell, BedDouble, AlertTriangle, Pill,
  Scissors, Users, Star, Apple, X, Plus, TrendingUp, Zap, Smile
} from 'lucide-react';
import { createHealthProfile } from '../utils/healthProfileApi';

const TOTAL_STEPS = 6;

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const EXERCISE_FREQUENCIES = ['Never', '1-2 days/week', '3-4 days/week', '5-6 days/week', 'Every day'];
const OCCUPATIONS = ['Student', 'Office Worker', 'Healthcare Professional', 'Teacher', 'Engineer', 'Business Owner', 'Freelancer', 'Retired', 'Homemaker', 'Other'];
const DIET_TYPES = ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Other'];
const CUISINE_OPTIONS = ['Indian', 'Mediterranean', 'Chinese', 'Japanese', 'Italian', 'American', 'Mexican', 'Middle Eastern', 'Thai', 'Korean'];

const HEALTH_GOALS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: Scale },
  { id: 'gain_weight', label: 'Gain Weight', icon: TrendingUp },
  { id: 'build_muscle', label: 'Build Muscle', icon: Dumbbell },
  { id: 'improve_fitness', label: 'Improve Fitness', icon: Heart },
  { id: 'better_sleep', label: 'Better Sleep', icon: BedDouble },
  { id: 'reduce_stress', label: 'Reduce Stress', icon: Smile },
  { id: 'healthy_eating', label: 'Healthy Eating', icon: Apple },
  { id: 'heart_health', label: 'Improve Heart Health', icon: Activity },
  { id: 'more_water', label: 'Increase Water Intake', icon: Droplets },
  { id: 'improve_stamina', label: 'Improve Stamina', icon: Zap }
];

const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Thyroid Disorder', 'Heart Disease', 'Arthritis', 'PCOS/PCOD', 'Anxiety/Depression', 'None'];
const COMMON_ALLERGIES = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat/Gluten', 'Soy', 'Fish', 'Shellfish', 'None'];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function InputField({ label, icon: Icon, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 text-left w-full" data-invalid={error ? 'true' : 'false'}>
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-450" />}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-rose-500 font-bold mt-0.5">⚠️ {error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', min, max, step, error }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/40 border text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all ${
        error
          ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
          : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
      }`}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, error }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/40 border text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer ${
        error
          ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
          : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
      }`}
    >
      <option value="" className="bg-white dark:bg-slate-950 text-slate-500">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">{opt}</option>
      ))}
    </select>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    onAdd(clean);
    setInput('');
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase() !== 'none' &&
    !tags.includes(s) &&
    s.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-500/30 text-sky-600 dark:text-sky-300 text-[11px] font-bold">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="hover:text-rose-500 dark:hover:text-rose-450 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => addTag(input)}
            className="px-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 6).map(s => (
              <button
                type="button"
                key={s}
                onMouseDown={() => addTag(s)}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {suggestions.includes('None') && tags.length === 0 && (
        <button
          type="button"
          onClick={() => onAdd('None')}
          className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-sky-500 font-bold text-left transition-colors self-start"
        >
          + Mark as 'None' (skip this section)
        </button>
      )}
    </div>
  );
}

function GoalPill({ goal, selected, onToggle }) {
  const Icon = goal.icon;
  return (
    <button
      type="button"
      onClick={() => onToggle(goal.id)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-205 text-left ${
        selected
          ? 'bg-sky-500/10 border-sky-500/60 text-sky-600 dark:text-sky-300 shadow-sm shadow-sky-500/10'
          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      <Icon className="h-4 w-4 text-sky-500 shrink-0" />
      <span>{goal.label}</span>
    </button>
  );
}

function MetricCard({ label, value, unit, icon, color = 'sky' }) {
  const colors = {
    sky: 'from-sky-500/10 to-indigo-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
    purple: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex flex-col gap-1 text-left`}>
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider opacity-70">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{value ?? '—'}</div>
      {unit && <div className="text-[10px] font-bold opacity-60">{unit}</div>}
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ data, onChange, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Basic Information</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tell us a little about yourself to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField label="Full Name" icon={User} required error={errors.fullName}>
            <TextInput value={data.fullName} onChange={v => onChange('fullName', v)} placeholder="John Doe" error={errors.fullName} />
          </InputField>
        </div>
        <InputField label="Age" icon={User} required error={errors.age}>
          <TextInput type="number" value={data.age} onChange={v => onChange('age', v)} placeholder="28" min="1" max="120" error={errors.age} />
        </InputField>
        <InputField label="Date of Birth" required error={errors.dateOfBirth}>
          <TextInput type="date" value={data.dateOfBirth} onChange={v => onChange('dateOfBirth', v)} error={errors.dateOfBirth} />
        </InputField>
        <InputField label="Gender" required error={errors.gender}>
          <SelectInput value={data.gender} onChange={v => onChange('gender', v)} options={GENDERS} placeholder="Select gender" error={errors.gender} />
        </InputField>
        <InputField label="Blood Group" required error={errors.bloodGroup}>
          <SelectInput value={data.bloodGroup} onChange={v => onChange('bloodGroup', v)} options={BLOOD_GROUPS} placeholder="Select blood group" error={errors.bloodGroup} />
        </InputField>
        <InputField label="Height (cm)" icon={Ruler} required error={errors.heightCm}>
          <TextInput type="number" value={data.heightCm} onChange={v => onChange('heightCm', v)} placeholder="170" min="50" max="300" error={errors.heightCm} />
        </InputField>
        <InputField label="Weight (kg)" icon={Scale} required error={errors.weightKg}>
          <TextInput type="number" value={data.weightKg} onChange={v => onChange('weightKg', v)} placeholder="70" min="10" max="500" step="0.1" error={errors.weightKg} />
        </InputField>
      </div>
    </div>
  );
}

function Step2({ data, onChange, errors = {} }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Lifestyle & Vitals</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Help us understand your vitals, daily routine, and habits.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField label="Activity Level" icon={Activity} required>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ACTIVITY_LEVELS.map(level => (
                <button
                  type="button"
                  key={level}
                  onClick={() => onChange('activityLevel', level)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    data.activityLevel === level
                      ? 'bg-sky-500/10 border-sky-500/60 text-sky-600 dark:text-sky-300 shadow-sm shadow-sky-500/10'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </InputField>
        </div>

        {/* Compulsory Vitals Section */}
        <InputField label="Heart Rate (BPM)" icon={Heart} required error={errors.heartRate}>
          <TextInput type="number" value={data.heartRate} onChange={v => onChange('heartRate', v)} placeholder="72" min="30" max="250" error={errors.heartRate} />
        </InputField>
        <InputField label="Blood Glucose (mg/dL)" icon={Zap} required error={errors.bloodGlucose}>
          <TextInput type="number" value={data.bloodGlucose} onChange={v => onChange('bloodGlucose', v)} placeholder="95" min="40" max="500" error={errors.bloodGlucose} />
        </InputField>
        <InputField label="BP Systolic (mmHg)" icon={Activity} required error={errors.bloodPressureSystolic}>
          <TextInput type="number" value={data.bloodPressureSystolic} onChange={v => onChange('bloodPressureSystolic', v)} placeholder="120" min="50" max="250" error={errors.bloodPressureSystolic} />
        </InputField>
        <InputField label="BP Diastolic (mmHg)" icon={Activity} required error={errors.bloodPressureDiastolic}>
          <TextInput type="number" value={data.bloodPressureDiastolic} onChange={v => onChange('bloodPressureDiastolic', v)} placeholder="80" min="30" max="150" error={errors.bloodPressureDiastolic} />
        </InputField>

        {/* Lifestyle Vitals */}
        <InputField label="Average Sleep Hours" icon={BedDouble} required error={errors.sleepHours}>
          <TextInput type="number" value={data.sleepHours} onChange={v => onChange('sleepHours', v)} placeholder="8" min="0" max="24" step="0.5" error={errors.sleepHours} />
        </InputField>
        <InputField label="Daily Water Intake (liters)" icon={Droplets} required error={errors.waterIntakeLiters}>
          <TextInput type="number" value={data.waterIntakeLiters} onChange={v => onChange('waterIntakeLiters', v)} placeholder="2.5" min="0" max="20" step="0.1" error={errors.waterIntakeLiters} />
        </InputField>

        {/* Optional Lifestyle Details */}
        <InputField label="Occupation" icon={Briefcase}>
          <SelectInput value={data.occupation} onChange={v => onChange('occupation', v)} options={OCCUPATIONS} placeholder="Select occupation" />
        </InputField>
        <InputField label="Daily Working Hours" icon={Clock}>
          <TextInput type="number" value={data.dailyWorkingHours} onChange={v => onChange('dailyWorkingHours', v)} placeholder="8" min="0" max="24" />
        </InputField>
        <InputField label="Exercise Frequency" icon={Dumbbell}>
          <SelectInput value={data.exerciseFrequency} onChange={v => onChange('exerciseFrequency', v)} options={EXERCISE_FREQUENCIES} placeholder="Select frequency" />
        </InputField>
        <InputField label="Wake-up Time" icon={Sun}>
          <TextInput type="time" value={data.wakeTime} onChange={v => onChange('wakeTime', v)} />
        </InputField>
        <InputField label="Bedtime" icon={Moon}>
          <TextInput type="time" value={data.bedtime} onChange={v => onChange('bedtime', v)} />
        </InputField>
      </div>
    </div>
  );
}

function Step3({ data, onChange, errors = {} }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Medical Information</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please enter your medical details. If none apply, mark or add "None".</p>
      </div>
      <div className="flex flex-col gap-4">
        <InputField label="Medical Conditions" icon={Heart} required error={errors.medicalConditions}>
          <TagInput
            tags={data.medicalConditions}
            onAdd={v => onChange('medicalConditions', [...data.medicalConditions.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('medicalConditions', data.medicalConditions.filter(x => x !== v))}
            placeholder="Type a condition and press Enter..."
            suggestions={COMMON_CONDITIONS}
          />
        </InputField>
        <InputField label="Allergies" icon={AlertTriangle} required error={errors.allergies}>
          <TagInput
            tags={data.allergies}
            onAdd={v => onChange('allergies', [...data.allergies.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('allergies', data.allergies.filter(x => x !== v))}
            placeholder="Type an allergy and press Enter..."
            suggestions={COMMON_ALLERGIES}
          />
        </InputField>
        <InputField label="Current Medications" icon={Pill} required error={errors.currentMedications}>
          <TagInput
            tags={data.currentMedications}
            onAdd={v => onChange('currentMedications', [...data.currentMedications.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('currentMedications', data.currentMedications.filter(x => x !== v))}
            placeholder="E.g. Metformin, Lisinopril, or None..."
            suggestions={['None']}
          />
        </InputField>
        <InputField label="Previous Surgeries" icon={Scissors} required error={errors.previousSurgeries}>
          <TagInput
            tags={data.previousSurgeries}
            onAdd={v => onChange('previousSurgeries', [...data.previousSurgeries.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('previousSurgeries', data.previousSurgeries.filter(x => x !== v))}
            placeholder="E.g. Appendectomy, or None..."
            suggestions={['None']}
          />
        </InputField>
        <InputField label="Family Medical History" icon={Users} required error={errors.familyHistory}>
          <TagInput
            tags={data.familyHistory}
            onAdd={v => onChange('familyHistory', [...data.familyHistory.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('familyHistory', data.familyHistory.filter(x => x !== v))}
            placeholder="E.g. Diabetes (Father), or None..."
            suggestions={['None']}
          />
        </InputField>
        <InputField label="Disabilities (Optional)" icon={Star}>
          <TagInput
            tags={data.disabilities}
            onAdd={v => onChange('disabilities', [...data.disabilities, v])}
            onRemove={v => onChange('disabilities', data.disabilities.filter(x => x !== v))}
            placeholder="Type a disability and press Enter..."
          />
        </InputField>
      </div>
    </div>
  );
}

function Step4({ data, onChange, errors }) {
  const toggle = (goalId) => {
    const current = data.healthGoals;
    if (current.includes(goalId)) {
      onChange('healthGoals', current.filter(g => g !== goalId));
    } else {
      onChange('healthGoals', [...current, goalId]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div data-invalid={errors.healthGoals ? 'true' : 'false'}>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Health Goals</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select all that apply. You can change these anytime.</p>
        {errors.healthGoals && <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ {errors.healthGoals}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {HEALTH_GOALS.map(goal => (
          <GoalPill key={goal.id} goal={goal} selected={data.healthGoals.includes(goal.id)} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}

function Step5({ data, onChange, errors = {} }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Food Preferences</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Help us build a diet plan tailored to your tastes.</p>
      </div>
      <div className="flex flex-col gap-4">
        <InputField label="Diet Type" icon={Apple} required>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIET_TYPES.map(diet => (
              <button
                type="button"
                key={diet}
                onClick={() => onChange('dietType', diet)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  data.dietType === diet
                    ? 'bg-sky-500/10 border-sky-500/60 text-sky-600 dark:text-sky-300 shadow-sm shadow-sky-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>
        </InputField>
        <InputField label="Food Allergies" icon={AlertTriangle} required error={errors.foodAllergies}>
          <TagInput
            tags={data.foodAllergies}
            onAdd={v => onChange('foodAllergies', [...data.foodAllergies.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('foodAllergies', data.foodAllergies.filter(x => x !== v))}
            placeholder="E.g. Peanuts, Dairy, or None..."
            suggestions={COMMON_ALLERGIES}
          />
        </InputField>
        <InputField label="Preferred Cuisines" icon={Utensils} required error={errors.cuisinePreference}>
          <div className="flex flex-wrap gap-2" data-invalid={errors.cuisinePreference ? 'true' : 'false'}>
            {CUISINE_OPTIONS.map(cuisine => (
              <button
                type="button"
                key={cuisine}
                onClick={() => {
                  const current = data.cuisinePreference;
                  onChange('cuisinePreference', current.includes(cuisine) ? current.filter(c => c !== cuisine) : [...current, cuisine]);
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  data.cuisinePreference.includes(cuisine)
                    ? 'bg-sky-500/10 border-sky-500/60 text-sky-600 dark:text-sky-300'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </InputField>
        <InputField label="Foods You Like" required error={errors.foodsLiked}>
          <TagInput
            tags={data.foodsLiked}
            onAdd={v => onChange('foodsLiked', [...data.foodsLiked.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('foodsLiked', data.foodsLiked.filter(x => x !== v))}
            placeholder="E.g. Grilled chicken, Berries, or None..."
            suggestions={['None']}
          />
        </InputField>
        <InputField label="Foods to Avoid" required error={errors.foodsToAvoid}>
          <TagInput
            tags={data.foodsToAvoid}
            onAdd={v => onChange('foodsToAvoid', [...data.foodsToAvoid.filter(x => x !== 'None'), v].filter(Boolean))}
            onRemove={v => onChange('foodsToAvoid', data.foodsToAvoid.filter(x => x !== v))}
            placeholder="E.g. Deep fried food, Spicy food, or None..."
            suggestions={['None']}
          />
        </InputField>
      </div>
    </div>
  );
}

function Step6({ data, isLoading, isSuccess, metrics, error }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-sky-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-slate-850 dark:text-white">Setting Up Your Profile</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculating your personalized health metrics...</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs text-left mx-auto">
          {['Saving your health profile...', 'Calculating BMI...', 'Setting up water goals...', 'Estimating daily calories...'].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="w-4 h-4 rounded-full bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-505" />
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="h-8 w-8 text-rose-505" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Something went wrong</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isSuccess && metrics) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center mb-3">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Profile Created!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Here are your personalized health metrics.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="BMI"
            value={metrics.bmi}
            unit={metrics.bmiCategory}
            icon={<Scale className="h-3.5 w-3.5" />}
            color={metrics.bmiCategory === 'Normal weight' ? 'emerald' : 'amber'}
          />
          <MetricCard
            label="Water Goal"
            value={metrics.dailyWaterGoalLiters}
            unit="liters / day"
            icon={<Droplets className="h-3.5 w-3.5" />}
            color="sky"
          />
          <MetricCard
            label="Daily Calories"
            value={metrics.dailyCalorieEstimate ? `${metrics.dailyCalorieEstimate.toLocaleString()}` : null}
            unit="kcal estimate"
            icon={<Activity className="h-3.5 w-3.5" />}
            color="purple"
          />
          <MetricCard
            label="Health Score"
            value={metrics.initialHealthScore}
            unit="out of 100"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            color="emerald"
          />
        </div>

        <div className="bg-sky-500/5 border border-sky-500/10 dark:border-sky-500/20 rounded-2xl p-4 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
            Redirecting you to your personalized dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 items-center justify-center py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/20 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-sky-500" />
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">You're all set!</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          Click "Complete Setup" to save your profile and generate your personalized health dashboard.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 w-full max-w-xs mx-auto">
        <div className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/60 font-bold">
          <span>BMI Calculation</span>
          <span className="text-sky-500">✓ Ready</span>
        </div>
        <div className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/60 font-bold">
          <span>Water Goal</span>
          <span className="text-sky-500">✓ Ready</span>
        </div>
        <div className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/60 font-bold">
          <span>Calorie Estimate</span>
          <span className="text-sky-500">✓ Ready</span>
        </div>
        <div className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/60 font-bold">
          <span>Personalized Dashboard</span>
          <span className="text-sky-500">✓ Ready</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

export default function Onboarding({ theme, setTheme }) {
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [computedMetrics, setComputedMetrics] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  // ─── Form state (all 6 steps) ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Step 1
    fullName: localStorage.getItem('userName') || '',
    age: '',
    dateOfBirth: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    bloodGroup: '',
    // Step 2
    activityLevel: 'Moderately Active',
    occupation: '',
    dailyWorkingHours: '',
    exerciseFrequency: '1-2 days/week',
    sleepHours: '',
    wakeTime: '',
    bedtime: '',
    waterIntakeLiters: '',
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    bloodGlucose: '',
    // Step 3
    medicalConditions: [],
    allergies: [],
    currentMedications: [],
    previousSurgeries: [],
    familyHistory: [],
    disabilities: [],
    // Step 4
    healthGoals: [],
    // Step 5
    dietType: 'Vegetarian',
    foodAllergies: [],
    cuisinePreference: [],
    foodsLiked: [],
    foodsToAvoid: []
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.fullName || !formData.fullName.trim()) {
        newErrors.fullName = 'Full Name is required.';
      }
      if (!formData.age || Number(formData.age) < 1 || Number(formData.age) > 120) {
        newErrors.age = 'A valid age between 1 and 120 is required.';
      }
      if (!formData.gender) {
        newErrors.gender = 'Gender selection is required.';
      }
      if (!formData.heightCm || Number(formData.heightCm) < 50 || Number(formData.heightCm) > 300) {
        newErrors.heightCm = 'A valid height in cm (50-300) is required.';
      }
      if (!formData.weightKg || Number(formData.weightKg) < 10 || Number(formData.weightKg) > 500) {
        newErrors.weightKg = 'A valid weight in kg (10-500) is required.';
      }
    }
    if (currentStep === 2) {
      if (!formData.heartRate || Number(formData.heartRate) < 30 || Number(formData.heartRate) > 250) {
        newErrors.heartRate = 'Heart rate is required (30-250 BPM).';
      }
      if (!formData.bloodGlucose || Number(formData.bloodGlucose) < 40 || Number(formData.bloodGlucose) > 500) {
        newErrors.bloodGlucose = 'Blood glucose is required (40-500 mg/dL).';
      }
      if (!formData.bloodPressureSystolic || Number(formData.bloodPressureSystolic) < 50 || Number(formData.bloodPressureSystolic) > 250) {
        newErrors.bloodPressureSystolic = 'Systolic BP is required (50-250 mmHg).';
      }
      if (!formData.bloodPressureDiastolic || Number(formData.bloodPressureDiastolic) < 30 || Number(formData.bloodPressureDiastolic) > 150) {
        newErrors.bloodPressureDiastolic = 'Diastolic BP is required (30-150 mmHg).';
      }
      if (!formData.sleepHours || Number(formData.sleepHours) < 1 || Number(formData.sleepHours) > 24) {
        newErrors.sleepHours = 'Average sleep hours is required (1-24).';
      }
      if (!formData.waterIntakeLiters || Number(formData.waterIntakeLiters) < 0.5 || Number(formData.waterIntakeLiters) > 15) {
        newErrors.waterIntakeLiters = 'Daily water intake is required (0.5-15 L).';
      }
    }
    if (currentStep === 3) {
      // Step 3 (Medical details) is optional. No validation constraints.
    }
    if (currentStep === 4) {
      if (!formData.healthGoals || formData.healthGoals.length === 0) {
        newErrors.healthGoals = 'Please select at least one health goal.';
      }
    }
    if (currentStep === 5) {
      // Step 5 (Dietary details) is optional. No validation constraints.
    }
    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors) {
      // Auto scroll to first element with error in the DOM
      setTimeout(() => {
        const invalidInput = document.querySelector('[data-invalid="true"]');
        if (invalidInput) {
          invalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus input or select within it
          const inputEl = invalidInput.querySelector('input, select');
          if (inputEl) inputEl.focus();
        }
      }, 50);
    }
    return !hasErrors;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
    setErrors({});
  };

  const toggleTheme = () => {
    if (setTheme) setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setIsLoading(true);
    setSubmitError('');
    try {
      const result = await createHealthProfile({
        ...formData,
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        age: Number(formData.age),
        sleepHours: Number(formData.sleepHours) || undefined,
        dailyWorkingHours: Number(formData.dailyWorkingHours) || undefined,
        waterIntakeLiters: Number(formData.waterIntakeLiters) || undefined,
        heartRate: Number(formData.heartRate) || undefined,
        bloodPressureSystolic: Number(formData.bloodPressureSystolic) || undefined,
        bloodPressureDiastolic: Number(formData.bloodPressureDiastolic) || undefined,
        bloodGlucose: Number(formData.bloodGlucose) || undefined
      });
      setComputedMetrics(result.computedMetrics);
      setIsSuccess(true);

      // Store onboarding status locally
      localStorage.setItem('onboardingCompleted', 'true');

      // Store health profile in localStorage for quick access
      if (result.profile) {
        localStorage.setItem('healthProfile', JSON.stringify(result.profile));
      }

      // Redirect to dashboard after 2.5 seconds
      setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save health profile. Please try again.');
      setIsLoading(false);
    }
  };

  const stepIcons = [User, Activity, Heart, Target, Utensils, Sparkles];
  const stepLabels = ['Basic Info', 'Lifestyle', 'Medical', 'Goals', 'Food', 'Finish'];

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 data={formData} onChange={handleChange} errors={errors} />;
      case 2: return <Step2 data={formData} onChange={handleChange} errors={errors} />;
      case 3: return <Step3 data={formData} onChange={handleChange} errors={errors} />;
      case 4: return <Step4 data={formData} onChange={handleChange} errors={errors} />;
      case 5: return <Step5 data={formData} onChange={handleChange} errors={errors} />;
      case 6: return <Step6 data={formData} isLoading={isLoading} isSuccess={isSuccess} metrics={computedMetrics} error={submitError} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-black/40 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-2.5">
          <img src="/logos/Logo (MAIN).png" alt="MediGrid" className="h-5 w-auto object-contain" />
          <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">MediGrid</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">
            Health Profile Setup
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-500 dark:hover:text-sky-400 transition-all focus:outline-none"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-sky-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
          </button>
        </div>
      </div>

      {/* Progress Wizard */}
      <div className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator dots */}
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const StepIcon = stepIcons[i];
              const isCompleted = i + 1 < step;
              const isActive = i + 1 === step;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (i + 1 < step && !isLoading && !isSuccess) {
                        setStep(i + 1);
                        setErrors({});
                      }
                    }}
                    disabled={isLoading || isSuccess || i + 1 >= step}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 cursor-pointer'
                        : isActive
                        ? 'bg-sky-500/10 dark:bg-sky-500/20 border-2 border-sky-500 shadow-md shadow-sky-500/20 text-sky-600 dark:text-sky-400 font-bold'
                        : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-650'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4.5 w-4.5 text-white" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${
                    isActive ? 'text-sky-600 dark:text-sky-400' : isCompleted ? 'text-sky-500' : 'text-slate-400 dark:text-slate-600'
                  }`}>{stepLabels[i]}</span>
                </div>
              );
            }).reduce((acc, el, i) => {
              if (i === 0) return [el];
              const lineCompleted = i <= step - 1;
              return [
                ...acc,
                <div key={`line-${i}`} className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${lineCompleted ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-800'}`} />,
                el
              ];
            }, [])}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}% complete</span>
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-6 pb-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white/80 dark:bg-[#090b0d]/70 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-slate-100 dark:shadow-black/50 min-h-[420px] transition-colors duration-300">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          {!isSuccess && (
            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || isLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white dark:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {step < TOTAL_STEPS - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1 && !validateStep(1)) return;
                      setStep(prev => prev + 1);
                    }}
                    className="text-xs text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-400 transition-colors px-3 font-bold"
                  >
                    Skip Section
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-bold text-white shadow-lg shadow-sky-500/10 dark:shadow-sky-500/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : !isLoading && !isSuccess && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Complete Setup
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
