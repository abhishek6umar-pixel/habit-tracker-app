const ComponentFunction = function() {
  const React = require('react');
  const { useState, useEffect, useContext, useMemo, useCallback, useRef } = React;
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, FlatList, Dimensions, Animated, Easing } = require('react-native');
  const { MaterialIcons } = require('@expo/vector-icons');
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');

  // ─── THEME ───────────────────────────────────────────────────────────────────
  const primaryColor    = '#7C3AED';
  const accentColor     = '#F59E0B';
  const backgroundColor = '#0A0910';
  const cardColor       = '#131020';
  const cardBorder      = '#1E1A30';
  const textPrimary     = '#F0EEFF';
  const textSecondary   = '#7B7494';
  const successColor    = '#10D98A';
  const errorColor      = '#FF4D6D';
  const goldCoinColor   = '#FFD700';
  const timerGlow       = '#9D6FFF';

  const Tab = createBottomTabNavigator();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // ─── THEME CONTEXT ───────────────────────────────────────────────────────────
  const ThemeContext = React.createContext();
  const ThemeProvider = function(props) {
    const [darkMode, setDarkMode] = useState(true);
    const theme = useMemo(() => ({
      colors: {
        primary:       darkMode ? primaryColor    : '#6D28D9',
        accent:        darkMode ? accentColor     : '#D97706',
        background:    darkMode ? backgroundColor : '#F5F3FF',
        card:          darkMode ? cardColor       : '#FFFFFF',
        cardBorder:    darkMode ? cardBorder      : '#EDE9FE',
        textPrimary:   darkMode ? textPrimary     : '#1E1B4B',
        textSecondary: darkMode ? textSecondary   : '#6B7280',
        border:        darkMode ? '#2A2440'       : '#DDD6FE',
        success:       successColor,
        error:         errorColor,
        warning:       accentColor,
        timerGlow:     timerGlow
      }
    }), [darkMode]);
    const value = useMemo(() => ({ theme, darkMode, toggleDarkMode: () => setDarkMode(p => !p) }), [theme, darkMode]);
    return React.createElement(ThemeContext.Provider, { value }, props.children);
  };
  const useTheme = () => useContext(ThemeContext);

  // ─── GLOBAL STATE (coins shared across screens) ───────────────────────────────
  const GlobalContext = React.createContext();
  const GlobalProvider = function(props) {
    const [goldCoins, setGoldCoins] = useState(5);
    const [totalXP, setTotalXP]     = useState(785);
    const [level, setLevel]         = useState(8);
    const [habits, setHabits]       = useState([
      { id:'1', name:'Morning Walk',     icon:'directions-run',    category:'Fitness',  completed:false, streak:5,  xp:10 },
      { id:'2', name:'Read 30 mins',     icon:'book',              category:'Personal', completed:true,  streak:12, xp:20 },
      { id:'3', name:'Drink 8 Glasses',  icon:'local-drink',       category:'Health',   completed:false, streak:3,  xp:10 },
      { id:'4', name:'Meditate',         icon:'self-improvement',  category:'Health',   completed:true,  streak:7,  xp:15 },
      { id:'5', name:'Study Code',       icon:'code',              category:'Study',    completed:false, streak:2,  xp:25 },
      { id:'6', name:'Exercise',         icon:'fitness-center',    category:'Fitness',  completed:false, streak:4,  xp:15 },
      { id:'7', name:'Journal',          icon:'edit',              category:'Personal', completed:true,  streak:9,  xp:15 },
      { id:'8', name:'No Social Media',  icon:'phonelink-off',     category:'Personal', completed:false, streak:1,  xp:20 },
      { id:'9', name:'Healthy Meal',     icon:'restaurant',        category:'Health',   completed:true,  streak:6,  xp:15 },
      { id:'10',name:'Cold Shower',      icon:'shower',            category:'Health',   completed:false, streak:0,  xp:20 },
      { id:'11',name:'Stretch',          icon:'accessibility',     category:'Fitness',  completed:true,  streak:8,  xp:10 },
      { id:'12',name:'Learn Something',  icon:'lightbulb',         category:'Study',    completed:false, streak:3,  xp:25 },
      { id:'13',name:'Sleep by 11pm',    icon:'bedtime',           category:'Sleep',    completed:false, streak:2,  xp:20 },
    ]);

    const addCoins = useCallback((n) => setGoldCoins(p => p + n), []);
    const removeCoins = useCallback((n) => setGoldCoins(p => Math.max(0, p - n)), []);
    const toggleHabit = useCallback((id) => {
      setHabits(prev => prev.map(h => {
        if (h.id !== id) return h;
        const done = !h.completed;
        const xpDelta = done ? h.xp : -h.xp;
        setTotalXP(xp => {
          const nx = Math.max(0, xp + xpDelta);
          setLevel(Math.floor(nx / 100) + 1);
          return nx;
        });
        return { ...h, completed: done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }));
    }, []);

    const value = useMemo(() => ({ goldCoins, setGoldCoins, addCoins, removeCoins, totalXP, level, habits, setHabits, toggleHabit }), [goldCoins, totalXP, level, habits, toggleHabit]);
    return React.createElement(GlobalContext.Provider, { value }, props.children);
  };
  const useGlobal = () => useContext(GlobalContext);

  // ─── QUOTES ──────────────────────────────────────────────────────────────────
  const QUOTES = [
    { full: "We are what we repeatedly do. Excellence is not an act, but a habit.", short: "Be Consistent" },
    { full: "Small daily improvements over time lead to stunning results.", short: "Stay Patient" },
    { full: "The secret to getting ahead is getting started.", short: "Begin Now" },
    { full: "Don't watch the clock; do what it does. Keep going.", short: "Keep Moving" },
    { full: "Success is the sum of small efforts repeated every day.", short: "Small Steps" },
    { full: "Your future is created by what you do today, not tomorrow.", short: "Act Today" },
    { full: "Discipline is choosing between what you want now and what you want most.", short: "Stay Focused" },
    { full: "It always seems impossible until it's done.", short: "Push Through" },
  ];
  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

  // ─── HELPER: PULSE ANIMATION ─────────────────────────────────────────────────
  const usePulse = (active) => {
    const anim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      if (active) {
        const loop = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue:1.06, duration:800, useNativeDriver:true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(anim, { toValue:1,    duration:800, useNativeDriver:true, easing: Easing.inOut(Easing.ease) }),
        ]));
        loop.start();
        return () => loop.stop();
      } else { anim.setValue(1); }
    }, [active]);
    return anim;
  };

  const useFadeIn = (delay = 0) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(16)).current;
    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue:1, duration:500, delay, useNativeDriver:true }),
        Animated.timing(translateY, { toValue:0, duration:500, delay, useNativeDriver:true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    }, []);
    return { opacity, transform: [{ translateY }] };
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ═══════════════════════════════════════════════════════════════════════════════
  const HomeScreen = function() {
    const { theme } = useTheme();
    const { habits, toggleHabit, totalXP, level, goldCoins } = useGlobal();
    const c = theme.colors;

    const completed = habits.filter(h => h.completed).length;
    const pct = Math.round((completed / habits.length) * 100);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

    const fadeHeader  = useFadeIn(0);
    const fadeQuote   = useFadeIn(80);
    const fadeHabits  = useFadeIn(160);
    const pulseScale  = usePulse(false);

    const progressAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(progressAnim, { toValue: pct, duration: 900, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();
    }, [pct]);
    const progressWidth = progressAnim.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] });

    return React.createElement(View, { style: [s.flex1, { backgroundColor: c.background }] },
      React.createElement(ScrollView, { contentContainerStyle: { paddingBottom: 100, paddingTop: 16 } },

        // ── Quote Banner (TOP) ──
        React.createElement(Animated.View, { style: [s.px16, s.mb12, fadeQuote] },
          React.createElement(View, { style: [s.quoteBanner, { backgroundColor: c.primary + '18', borderColor: c.primary + '40', borderWidth: 1 }] },
            React.createElement(MaterialIcons, { name:'format-quote', size:18, color: c.primary }),
            React.createElement(Text, { style: [s.quoteBannerText, { color: c.textPrimary }] }, todayQuote.full)
          )
        ),

        // ── Header ──
        React.createElement(Animated.View, { style: [s.px16, fadeHeader] },
          React.createElement(View, { style: [s.homeHeader, { backgroundColor: c.card, borderColor: c.cardBorder }] },
            React.createElement(View, { style: s.flex1 },
              React.createElement(Text, { style: [s.greeting, { color: c.textPrimary }] }, greeting),
              React.createElement(Text, { style: [s.greetingSub, { color: c.textSecondary }] }, 'Keep building great habits ✨'),
              React.createElement(View, { style: s.row },
                React.createElement(View, { style: [s.pill, { backgroundColor: c.primary + '25' }] },
                  React.createElement(MaterialIcons, { name:'star', size:13, color: c.primary }),
                  React.createElement(Text, { style: [s.pillText, { color: c.primary }] }, ' Lv.' + level + ' • ' + totalXP + 'XP')
                ),
                React.createElement(View, { style: [s.pill, { backgroundColor: goldCoinColor + '22', marginLeft: 8 }] },
                  React.createElement(MaterialIcons, { name:'monetization-on', size:13, color: goldCoinColor }),
                  React.createElement(Text, { style: [s.pillText, { color: goldCoinColor }] }, ' ' + goldCoins + ' Coins')
                )
              )
            ),
            // Circular ring
            React.createElement(View, { style: s.ringWrap },
              React.createElement(View, { style: [s.ringOuter, { borderColor: c.border }] }),
              React.createElement(View, { style: [s.ringInner, { borderColor: c.primary }] }),
              React.createElement(View, { style: s.ringCenter },
                React.createElement(Text, { style: [s.ringPct, { color: c.textPrimary }] }, pct + '%'),
                React.createElement(Text, { style: [s.ringLbl, { color: c.textSecondary }] }, 'done')
              )
            )
          )
        ),

        // ── Progress Bar ──
        React.createElement(View, { style: [s.px16, s.mb16] },
          React.createElement(View, { style: [s.progressTrack, { backgroundColor: c.border }] },
            React.createElement(Animated.View, { style: [s.progressFill, { width: progressWidth, backgroundColor: c.primary }] })
          ),
          React.createElement(Text, { style: [s.progressCaption, { color: c.textSecondary }] }, completed + ' of ' + habits.length + ' habits done today')
        ),

        // ── Habit List ──
        React.createElement(Animated.View, { style: [s.px16, fadeHabits] },
          React.createElement(Text, { style: [s.sectionTitle, { color: c.textPrimary }] }, "Today's Habits"),
          habits.map((habit, i) =>
            React.createElement(HabitRow, { key: habit.id, habit, onToggle: toggleHabit, theme, delay: i * 40 })
          )
        ),

        // ── Bottom mini quote ──
        React.createElement(View, { style: [s.px16, s.mt8] },
          React.createElement(Text, { style: [s.miniQuote, { color: c.textSecondary }] }, '— ' + todayQuote.short)
        )
      )
    );
  };

  const HabitRow = React.memo(function({ habit, onToggle, theme, delay }) {
    const c = theme.colors;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const checkAnim = useRef(new Animated.Value(habit.completed ? 1 : 0)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue:0.95, duration:80, useNativeDriver:true }),
        Animated.timing(scaleAnim, { toValue:1,    duration:120, useNativeDriver:true })
      ]).start();
      Animated.timing(checkAnim, { toValue: habit.completed ? 0 : 1, duration: 200, useNativeDriver:false }).start();
      onToggle(habit.id);
    };

    const bgColor = checkAnim.interpolate({ inputRange:[0,1], outputRange:[c.card, c.primary + '18'] });
    const borderColor = checkAnim.interpolate({ inputRange:[0,1], outputRange:[c.cardBorder, c.primary + '60'] });

    return React.createElement(Animated.View, { style: { transform:[{scale: scaleAnim}], marginBottom: 10 } },
      React.createElement(TouchableOpacity, { onPress: handlePress, activeOpacity: 0.85 },
        React.createElement(Animated.View, { style: [s.habitRow, { backgroundColor: bgColor, borderColor, borderWidth: 1 }] },
          // Checkbox
          React.createElement(View, { style: [s.checkbox, {
            backgroundColor: habit.completed ? c.primary : 'transparent',
            borderColor: habit.completed ? c.primary : c.border
          }] },
            habit.completed && React.createElement(MaterialIcons, { name:'check', size:14, color:'#fff' })
          ),
          // Icon
          React.createElement(View, { style: [s.habitIconBg, { backgroundColor: c.primary + '20' }] },
            React.createElement(MaterialIcons, { name: habit.icon, size:20, color: c.primary })
          ),
          // Info
          React.createElement(View, { style: s.flex1 },
            React.createElement(Text, { style: [s.habitName, { color: c.textPrimary, opacity: habit.completed ? 0.6 : 1, textDecorationLine: habit.completed ? 'line-through' : 'none' }] }, habit.name),
            React.createElement(Text, { style: [s.habitCat, { color: c.textSecondary }] }, habit.category)
          ),
          // Right
          React.createElement(View, { style: s.habitRight },
            React.createElement(View, { style: s.rowCenter },
              React.createElement(MaterialIcons, { name:'local-fire-department', size:13, color: c.accent }),
              React.createElement(Text, { style: [s.streakNum, { color: c.accent }] }, ' ' + habit.streak)
            ),
            React.createElement(Text, { style: [s.xpTag, { color: c.primary }] }, '+' + habit.xp + 'xp')
          )
        )
      )
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // TIMER SCREEN (Separate Tab)
  // ═══════════════════════════════════════════════════════════════════════════════
  const TIMER_PRESETS = [
    { label:'25 min',  minutes:25,  coins:0, color:'#06B6D4' },
    { label:'45 min',  minutes:45,  coins:1, color:'#7C3AED' },
    { label:'1 Hour',  minutes:60,  coins:2, color:'#F59E0B' },
    { label:'1.5 Hr',  minutes:90,  coins:3, color:'#EF4444' },
    { label:'Custom',  minutes:0,   coins:null, color:'#10B981' },
  ];

  const TimerScreen = function() {
    const { theme } = useTheme();
    const { addCoins, removeCoins, goldCoins } = useGlobal();
    const c = theme.colors;

    const [selectedPreset, setSelectedPreset] = useState(1); // 45 min default
    const [customMinutes, setCustomMinutes]   = useState('60');
    const [timeLeft, setTimeLeft]             = useState(45 * 60);
    const [isRunning, setIsRunning]           = useState(false);
    const [isFullscreen, setIsFullscreen]     = useState(false);
    const [sessionDone, setSessionDone]       = useState(false);
    const [coinsEarned, setCoinsEarned]       = useState(0);

    const intervalRef = useRef(null);
    const pulseAnim   = usePulse(isRunning);
    const glowAnim    = useRef(new Animated.Value(0)).current;

    const getMinutes = () => {
      if (selectedPreset === 4) return parseInt(customMinutes) || 30;
      return TIMER_PRESETS[selectedPreset].minutes;
    };

    const getCoinsForSession = () => {
      const mins = getMinutes();
      if (mins >= 90) return 3;
      if (mins >= 60) return 2;
      if (mins >= 45) return 1;
      return 0;
    };

    const totalSeconds = getMinutes() * 60;
    const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
    const minutes  = Math.floor(timeLeft / 60);
    const secs     = timeLeft % 60;
    const fmt = (n) => String(n).padStart(2, '0');
    const display  = fmt(minutes) + ':' + fmt(secs);

    useEffect(() => {
      Animated.timing(glowAnim, { toValue: isRunning ? 1 : 0, duration: 600, useNativeDriver: false }).start();
    }, [isRunning]);

    useEffect(() => {
      if (isRunning) {
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(intervalRef.current);
              setIsRunning(false);
              const earned = getCoinsForSession();
              if (earned > 0) { addCoins(earned); setCoinsEarned(earned); }
              setSessionDone(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else clearInterval(intervalRef.current);
      return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const handlePresetSelect = (idx) => {
      if (isRunning) return;
      setSelectedPreset(idx);
      setSessionDone(false);
      setCoinsEarned(0);
      const mins = idx === 4 ? (parseInt(customMinutes) || 60) : TIMER_PRESETS[idx].minutes;
      setTimeLeft(mins * 60);
    };

    const handleStart = () => {
      if (sessionDone) {
        setSessionDone(false);
        setCoinsEarned(0);
        setTimeLeft(getMinutes() * 60);
        return;
      }
      setIsRunning(r => !r);
    };

    const handleAbandon = () => {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setSessionDone(false);
      setTimeLeft(getMinutes() * 60);
      if (timeLeft < totalSeconds * 0.9) removeCoins(1);
    };

    const handleCustomChange = (val) => {
      setCustomMinutes(val);
      if (!isRunning) setTimeLeft((parseInt(val) || 0) * 60);
    };

    const preset = TIMER_PRESETS[selectedPreset];
    const presetColor = preset.color;

    const glowColor = glowAnim.interpolate({ inputRange:[0,1], outputRange:['rgba(124,58,237,0)', 'rgba(124,58,237,0.25)'] });

    const timerContent = React.createElement(View, { style: [s.timerFull, { backgroundColor: isFullscreen ? backgroundColor : 'transparent' }] },

      // ── Preset Selector ──
      !isFullscreen && React.createElement(View, { style: [s.presetRow] },
        TIMER_PRESETS.map((p, i) =>
          React.createElement(TouchableOpacity, {
            key: i,
            style: [s.presetChip, {
              backgroundColor: selectedPreset === i ? p.color + '25' : c.card,
              borderColor: selectedPreset === i ? p.color : c.border,
              borderWidth: 1.5
            }],
            onPress: () => handlePresetSelect(i)
          },
            React.createElement(Text, { style: [s.presetLabel, { color: selectedPreset === i ? p.color : c.textSecondary }] }, p.label)
          )
        )
      ),

      // ── Custom Input ──
      !isFullscreen && selectedPreset === 4 && React.createElement(View, { style: [s.customRow] },
        React.createElement(TextInput, {
          style: [s.customInput, { color: c.textPrimary, borderColor: c.border, backgroundColor: c.card }],
          value: customMinutes,
          onChangeText: handleCustomChange,
          keyboardType: 'numeric',
          placeholder: 'Minutes',
          placeholderTextColor: c.textSecondary,
          editable: !isRunning
        }),
        React.createElement(Text, { style: [s.customUnit, { color: c.textSecondary }] }, 'minutes')
      ),

      // ── Timer Ring ──
      React.createElement(Animated.View, { style: [s.timerRingWrap, { shadowColor: presetColor, shadowOpacity: isRunning ? 0.6 : 0.2, shadowRadius: 30, elevation: isRunning ? 20 : 8, transform:[{scale: pulseAnim}] }] },
        React.createElement(View, { style: [s.timerRingOuter, { borderColor: c.border + '60' }] }),
        // Progress arc simulated with border
        React.createElement(View, { style: [s.timerRingProgress, { borderColor: presetColor, borderTopColor: progress > 0.25 ? presetColor : 'transparent', borderRightColor: progress > 0.5 ? presetColor : 'transparent', borderBottomColor: progress > 0.75 ? presetColor : 'transparent' }] }),
        React.createElement(View, { style: s.timerRingInner },
          sessionDone
            ? React.createElement(View, { style: s.doneWrap },
                React.createElement(MaterialIcons, { name:'check-circle', size:56, color: successColor }),
                React.createElement(Text, { style: [s.doneText, { color: successColor }] }, 'Session Done!'),
                coinsEarned > 0 && React.createElement(Text, { style: [s.coinEarned, { color: goldCoinColor }] }, '+' + coinsEarned + ' 🪙')
              )
            : React.createElement(View, { style: s.alignCenter },
                React.createElement(Text, { style: [s.timerDisplay, { color: c.textPrimary, fontSize: isFullscreen ? 80 : 60 }] }, display),
                React.createElement(Text, { style: [s.timerSubLabel, { color: presetColor }] }, preset.label + (preset.coins ? ' · +' + getCoinsForSession() + ' 🪙' : '')),
                isRunning && React.createElement(Text, { style: [s.focusHint, { color: c.textSecondary }] }, '🔥 Stay focused...')
              )
        )
      ),

      // ── Controls ──
      React.createElement(View, { style: [s.timerControls] },
        React.createElement(TouchableOpacity, {
          style: [s.timerBtn, s.timerBtnPrimary, { backgroundColor: presetColor }],
          onPress: handleStart
        },
          React.createElement(MaterialIcons, { name: sessionDone ? 'replay' : isRunning ? 'pause' : 'play-arrow', size:28, color:'#fff' }),
          React.createElement(Text, { style: s.timerBtnText }, sessionDone ? 'Restart' : isRunning ? 'Pause' : 'Start')
        ),
        React.createElement(TouchableOpacity, {
          style: [s.timerBtn, s.timerBtnOutline, { borderColor: c.border }],
          onPress: handleAbandon
        },
          React.createElement(MaterialIcons, { name:'stop', size:24, color: c.textSecondary }),
          React.createElement(Text, { style: [s.timerBtnText, { color: c.textSecondary }] }, 'Reset')
        ),
        React.createElement(TouchableOpacity, {
          style: [s.timerBtn, s.timerBtnOutline, { borderColor: c.border }],
          onPress: () => setIsFullscreen(f => !f)
        },
          React.createElement(MaterialIcons, { name: isFullscreen ? 'fullscreen-exit' : 'fullscreen', size:24, color: c.textSecondary }),
          React.createElement(Text, { style: [s.timerBtnText, { color: c.textSecondary }] }, isFullscreen ? 'Exit' : 'Focus')
        )
      ),

      // ── Coin Info Card ──
      !isFullscreen && React.createElement(View, { style: [s.coinInfoCard, { backgroundColor: c.card, borderColor: c.cardBorder }] },
        React.createElement(MaterialIcons, { name:'monetization-on', size:20, color: goldCoinColor }),
        React.createElement(View, { style: [s.flex1, s.ml8] },
          React.createElement(Text, { style: [s.coinCardTitle, { color: c.textPrimary }] }, 'Coin Rewards'),
          React.createElement(Text, { style: [s.coinCardSub, { color: c.textSecondary }] }, '45min=1🪙  60min=2🪙  90min+=3🪙  Max 3 per session'),
        ),
        React.createElement(View, { style: s.coinBal },
          React.createElement(Text, { style: [s.coinBalNum, { color: goldCoinColor }] }, goldCoins),
          React.createElement(Text, { style: [s.coinBalLabel, { color: c.textSecondary }] }, 'total')
        )
      )
    );

    if (isFullscreen) {
      return React.createElement(View, { style: [s.fullscreenTimer, { backgroundColor: backgroundColor }] },
        timerContent
      );
    }

    return React.createElement(ScrollView, { style: [s.flex1, { backgroundColor: c.background }], contentContainerStyle: { paddingBottom: 100, paddingTop: 20, paddingHorizontal: 16 } },
      React.createElement(Text, { style: [s.screenTitle, { color: c.textPrimary }] }, '⏱ Focus Timer'),
      timerContent
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADD HABIT SCREEN
  // ═══════════════════════════════════════════════════════════════════════════════
  const AddHabitScreen = function() {
    const { theme } = useTheme();
    const { habits, setHabits } = useGlobal();
    const c = theme.colors;

    const [name, setName]               = useState('');
    const [selectedIcon, setIcon]       = useState('star');
    const [selectedCategory, setCat]    = useState('Health');
    const [showPicker, setShowPicker]   = useState(false);
    const [saved, setSaved]             = useState(false);

    const categories = ['Health', 'Study', 'Personal', 'Sleep', 'Fitness'];
    const icons = ['star','favorite','fitness-center','book','local-drink','restaurant','music-note','brush','code','self-improvement','directions-run','bedtime','wb-sunny','nature','work','flash-on','psychology','emoji-events','school','spa'];

    const save = () => {
      if (!name.trim()) { Alert.alert('Oops', 'Please enter a habit name'); return; }
      const newHabit = { id: Date.now().toString(), name: name.trim(), icon: selectedIcon, category: selectedCategory, completed: false, streak: 0, xp: 15 };
      setHabits(prev => [...prev, newHabit]);
      setName(''); setIcon('star'); setCat('Health');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };

    return React.createElement(ScrollView, { style: [s.flex1, { backgroundColor: c.background }], contentContainerStyle: { padding: 16, paddingBottom: 100 } },
      React.createElement(Text, { style: [s.screenTitle, { color: c.textPrimary }] }, '✨ New Habit'),

      // Name Input
      React.createElement(View, { style: [s.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }] },
        React.createElement(Text, { style: [s.formLabel, { color: c.textPrimary }] }, 'Habit Name'),
        React.createElement(TextInput, {
          style: [s.formInput, { color: c.textPrimary, borderColor: c.border, backgroundColor: c.background }],
          value: name, onChangeText: setName,
          placeholder: 'e.g. Morning Run, Read Daily…',
          placeholderTextColor: c.textSecondary
        }),

        // Icon Selector
        React.createElement(Text, { style: [s.formLabel, { color: c.textPrimary, marginTop:16 }] }, 'Icon'),
        React.createElement(TouchableOpacity, {
          style: [s.iconSelector, { backgroundColor: c.background, borderColor: c.border }],
          onPress: () => setShowPicker(true)
        },
          React.createElement(View, { style: [s.iconPreview, { backgroundColor: c.primary + '20' }] },
            React.createElement(MaterialIcons, { name: selectedIcon, size:22, color: c.primary })
          ),
          React.createElement(Text, { style: [s.iconSelectorTxt, { color: c.textSecondary }] }, 'Tap to choose icon'),
          React.createElement(MaterialIcons, { name:'chevron-right', size:20, color: c.textSecondary })
        ),

        // Category
        React.createElement(Text, { style: [s.formLabel, { color: c.textPrimary, marginTop:16 }] }, 'Category'),
        React.createElement(View, { style: s.catWrap },
          categories.map(cat =>
            React.createElement(TouchableOpacity, {
              key: cat,
              style: [s.catChip, {
                backgroundColor: selectedCategory === cat ? c.primary : c.background,
                borderColor: selectedCategory === cat ? c.primary : c.border
              }],
              onPress: () => setCat(cat)
            },
              React.createElement(Text, { style: [s.catChipTxt, { color: selectedCategory === cat ? '#fff' : c.textSecondary }] }, cat)
            )
          )
        )
      ),

      // Save
      React.createElement(TouchableOpacity, {
        style: [s.saveBtn, { backgroundColor: saved ? successColor : c.primary }],
        onPress: save
      },
        React.createElement(MaterialIcons, { name: saved ? 'check' : 'add', size:22, color:'#fff' }),
        React.createElement(Text, { style: s.saveBtnTxt }, saved ? 'Habit Added!' : 'Create Habit')
      ),

      // Current habits count
      React.createElement(Text, { style: [s.habitsCount, { color: c.textSecondary }] }, habits.length + ' habits tracked'),

      // Icon Picker Modal
      React.createElement(Modal, { visible: showPicker, transparent:true, animationType:'slide', onRequestClose: () => setShowPicker(false) },
        React.createElement(View, { style: s.modalOverlay },
          React.createElement(View, { style: [s.iconModal, { backgroundColor: c.card }] },
            React.createElement(View, { style: [s.modalHeader, { borderBottomColor: c.border }] },
              React.createElement(Text, { style: [s.modalTitle, { color: c.textPrimary }] }, 'Choose Icon'),
              React.createElement(TouchableOpacity, { onPress: () => setShowPicker(false) },
                React.createElement(MaterialIcons, { name:'close', size:24, color: c.textPrimary })
              )
            ),
            React.createElement(FlatList, {
              data: icons, numColumns:5,
              keyExtractor: item => item,
              contentContainerStyle: { padding:12 },
              renderItem: ({ item }) =>
                React.createElement(TouchableOpacity, {
                  style: [s.iconOpt, {
                    backgroundColor: item === selectedIcon ? c.primary : c.background,
                    borderColor: c.border
                  }],
                  onPress: () => { setIcon(item); setShowPicker(false); }
                },
                  React.createElement(MaterialIcons, { name:item, size:26, color: item === selectedIcon ? '#fff' : c.textPrimary })
                )
            })
          )
        )
      )
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROGRESS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════════
  const ProgressScreen = function() {
    const { theme } = useTheme();
    const { habits } = useGlobal();
    const c = theme.colors;

    const weekly = [
      { day:'Mon', done:8,  total:13 },
      { day:'Tue', done:6,  total:13 },
      { day:'Wed', done:11, total:13 },
      { day:'Thu', done:7,  total:13 },
      { day:'Fri', done:13, total:13 },
      { day:'Sat', done:5,  total:13 },
      { day:'Sun', done:9,  total:13 },
    ];
    const maxBar = Math.max(...weekly.map(d => d.done));

    const catColors = { Health:'#10D98A', Fitness:'#F59E0B', Personal:'#7C3AED', Study:'#3B82F6', Sleep:'#06B6D4' };
    const catCounts = {};
    habits.forEach(h => { catCounts[h.category] = (catCounts[h.category] || 0) + 1; });
    const catData = Object.entries(catCounts).map(([name, count]) => ({ name, count, color: catColors[name] || '#9CA3AF' }));
    const totalCat = catData.reduce((s,d) => s + d.count, 0);

    const completedToday = habits.filter(h=>h.completed).length;
    const best  = [...habits].sort((a,b) => b.streak - a.streak).slice(0,3);
    const worst = [...habits].filter(h=>h.streak<3).slice(0,3);

    const barHeights = weekly.map(d => (d.done / maxBar) * 90);

    return React.createElement(ScrollView, { style:[s.flex1,{backgroundColor:c.background}], contentContainerStyle:{padding:16,paddingBottom:100} },
      React.createElement(Text, { style:[s.screenTitle,{color:c.textPrimary}] }, '📊 Analytics'),

      // Today Summary
      React.createElement(View, { style:[s.summaryRow] },
        [
          { label:'Done',    value: completedToday,              icon:'check-circle', color: c.success },
          { label:'Pending', value: habits.length-completedToday, icon:'pending',     color: c.warning },
          { label:'Streaks', value: habits.filter(h=>h.streak>=7).length, icon:'local-fire-department', color:'#FF6B6B' },
        ].map((item,i) =>
          React.createElement(View, { key:i, style:[s.summaryCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
            React.createElement(MaterialIcons, { name:item.icon, size:22, color:item.color }),
            React.createElement(Text, { style:[s.summaryNum,{color:c.textPrimary}] }, item.value),
            React.createElement(Text, { style:[s.summaryLbl,{color:c.textSecondary}] }, item.label)
          )
        )
      ),

      // Weekly Bar Chart
      React.createElement(View, { style:[s.chartCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(Text, { style:[s.chartTitle,{color:c.textPrimary}] }, 'Weekly Progress'),
        React.createElement(View, { style:s.barChartWrap },
          weekly.map((d,i) => {
            const isToday = i === new Date().getDay() === 0 ? 6 : new Date().getDay()-1;
            return React.createElement(View, { key:i, style:s.barCol },
              React.createElement(Text, { style:[s.barTopVal,{color:c.primary}] }, d.done),
              React.createElement(View, { style:[s.barBg,{backgroundColor:c.border}] },
                React.createElement(View, { style:[s.barFill,{height: barHeights[i], backgroundColor: i===5 ? c.primary + '60' : c.primary}] })
              ),
              React.createElement(Text, { style:[s.barDayLbl,{color: i===5 ? c.primary : c.textSecondary}] }, d.day)
            );
          })
        )
      ),

      // Category Pie (visual legend style)
      React.createElement(View, { style:[s.chartCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(Text, { style:[s.chartTitle,{color:c.textPrimary}] }, 'Habits by Category'),
        React.createElement(View, { style:s.catPieWrap },
          // Visual donut-like bars
          React.createElement(View, { style:s.catBarsCol },
            catData.map((cat,i) =>
              React.createElement(View, { key:i, style:s.catBarRow },
                React.createElement(Text, { style:[s.catBarLabel,{color:c.textPrimary}] }, cat.name),
                React.createElement(View, { style:[s.catBarTrack,{backgroundColor:c.border}] },
                  React.createElement(View, { style:[s.catBarFill,{width: ((cat.count/totalCat)*100)+'%', backgroundColor:cat.color}] })
                ),
                React.createElement(Text, { style:[s.catBarCount,{color:cat.color}] }, cat.count)
              )
            )
          )
        )
      ),

      // Best / Needs Work
      React.createElement(View, { style:s.rankRow },
        React.createElement(View, { style:[s.rankCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
          React.createElement(View, { style:s.rowCenter },
            React.createElement(MaterialIcons, { name:'trending-up', size:18, color:c.success }),
            React.createElement(Text, { style:[s.rankTitle,{color:c.success}] }, ' Top Habits')
          ),
          best.map((h,i) =>
            React.createElement(View, { key:i, style:s.rankItem },
              React.createElement(Text, { style:[s.rankName,{color:c.textPrimary}] }, h.name),
              React.createElement(Text, { style:[s.rankStat,{color:c.textSecondary}] }, '🔥 ' + h.streak + ' day streak')
            )
          )
        ),
        React.createElement(View, { style:[s.rankCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
          React.createElement(View, { style:s.rowCenter },
            React.createElement(MaterialIcons, { name:'flag', size:18, color:c.warning }),
            React.createElement(Text, { style:[s.rankTitle,{color:c.warning}] }, ' Focus On')
          ),
          worst.map((h,i) =>
            React.createElement(View, { key:i, style:s.rankItem },
              React.createElement(Text, { style:[s.rankName,{color:c.textPrimary}] }, h.name),
              React.createElement(Text, { style:[s.rankStat,{color:c.textSecondary}] }, '🔥 ' + h.streak + ' streak')
            )
          )
        )
      )
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SLEEP SCREEN
  // ═══════════════════════════════════════════════════════════════════════════════
  const SleepScreen = function() {
    const { theme } = useTheme();
    const c = theme.colors;

    const [sleepTime, setSleepTime] = useState('22:30');
    const [wakeTime,  setWakeTime]  = useState('07:00');
    const [quality,   setQuality]   = useState(7);
    const [saved,     setSaved]     = useState(false);

    const weekData = [
      { day:'Mon', h:8.5, q:8, goal:8 },
      { day:'Tue', h:7.2, q:6, goal:8 },
      { day:'Wed', h:8.8, q:9, goal:8 },
      { day:'Thu', h:7.5, q:7, goal:8 },
      { day:'Fri', h:6.8, q:5, goal:8 },
      { day:'Sat', h:9.2, q:9, goal:8 },
      { day:'Sun', h:8.1, q:8, goal:8 },
    ];
    const avgHrs = (weekData.reduce((s,d)=>s+d.h,0)/weekData.length).toFixed(1);
    const avgQ   = (weekData.reduce((s,d)=>s+d.q,0)/weekData.length).toFixed(1);

    const calcDuration = () => {
      const [sh,sm] = sleepTime.split(':').map(Number);
      const [wh,wm] = wakeTime.split(':').map(Number);
      let mins = (wh*60+wm) - (sh*60+sm);
      if (mins < 0) mins += 1440;
      return `${Math.floor(mins/60)}h ${mins%60}m`;
    };

    const qualityLabel = quality >= 8 ? '😴 Excellent' : quality >= 6 ? '🙂 Good' : quality >= 4 ? '😐 Fair' : '😴 Poor';
    const qualityColor = quality >= 8 ? successColor : quality >= 6 ? accentColor : quality >= 4 ? '#F59E0B' : errorColor;

    const handleSave = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };

    return React.createElement(ScrollView, { style:[s.flex1,{backgroundColor:c.background}], contentContainerStyle:{padding:16,paddingBottom:100} },
      React.createElement(Text, { style:[s.screenTitle,{color:c.textPrimary}] }, '😴 Sleep Tracker'),

      // Stats Summary
      React.createElement(View, { style:s.summaryRow },
        [
          { label:'Avg Sleep', value: avgHrs+'h',  color: c.primary },
          { label:'Avg Quality', value: avgQ+'/10', color: accentColor },
          { label:'Tonight Goal', value: '8h',     color: successColor },
        ].map((item,i) =>
          React.createElement(View, { key:i, style:[s.summaryCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
            React.createElement(Text, { style:[s.summaryNum,{color:item.color}] }, item.value),
            React.createElement(Text, { style:[s.summaryLbl,{color:c.textSecondary}] }, item.label)
          )
        )
      ),

      // Input Card
      React.createElement(View, { style:[s.sleepCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(View, { style:s.sleepTimeRow },
          React.createElement(View, { style:s.sleepTimeCol },
            React.createElement(View, { style:s.rowCenter },
              React.createElement(MaterialIcons, { name:'bedtime', size:20, color:c.primary }),
              React.createElement(Text, { style:[s.sleepTimeLabel,{color:c.textPrimary}] }, ' Bedtime')
            ),
            React.createElement(TextInput, {
              style:[s.sleepTimeInput,{color:c.textPrimary,borderColor:c.border,backgroundColor:c.background}],
              value:sleepTime, onChangeText:setSleepTime,
              placeholder:'22:30', placeholderTextColor:c.textSecondary
            })
          ),
          React.createElement(View, { style:[s.sleepArrow] },
            React.createElement(MaterialIcons, { name:'arrow-forward', size:24, color:c.textSecondary })
          ),
          React.createElement(View, { style:s.sleepTimeCol },
            React.createElement(View, { style:s.rowCenter },
              React.createElement(MaterialIcons, { name:'wb-sunny', size:20, color:accentColor }),
              React.createElement(Text, { style:[s.sleepTimeLabel,{color:c.textPrimary}] }, ' Wake Up')
            ),
            React.createElement(TextInput, {
              style:[s.sleepTimeInput,{color:c.textPrimary,borderColor:c.border,backgroundColor:c.background}],
              value:wakeTime, onChangeText:setWakeTime,
              placeholder:'07:00', placeholderTextColor:c.textSecondary
            })
          )
        ),
        React.createElement(View, { style:[s.durationBadge,{backgroundColor:c.primary+'20'}] },
          React.createElement(Text, { style:[s.durationVal,{color:c.primary}] }, calcDuration()),
          React.createElement(Text, { style:[s.durationLbl,{color:c.textSecondary}] }, 'sleep duration')
        ),
        React.createElement(Text, { style:[s.qualityTitle,{color:c.textPrimary}] }, 'Sleep Quality: ' + qualityLabel),
        React.createElement(View, { style:s.qualityDots },
          [1,2,3,4,5,6,7,8,9,10].map(n =>
            React.createElement(TouchableOpacity, {
              key:n,
              style:[s.qualDot,{
                backgroundColor: n<=quality ? qualityColor : c.border,
                transform:[{scale: n===quality ? 1.3 : 1}]
              }],
              onPress:()=>setQuality(n)
            })
          )
        ),
        React.createElement(TouchableOpacity, {
          style:[s.saveBtn,{backgroundColor: saved ? successColor : c.primary, marginTop:16}],
          onPress:handleSave
        },
          React.createElement(Text, { style:s.saveBtnTxt }, saved ? '✓ Saved!' : 'Log Sleep')
        )
      ),

      // Weekly Sleep Bar Chart (with goal line)
      React.createElement(View, { style:[s.chartCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(Text, { style:[s.chartTitle,{color:c.textPrimary}] }, 'Weekly Sleep Pattern'),
        React.createElement(Text, { style:[s.chartSubtitle,{color:c.textSecondary}] }, '📏 Goal: 8h  |  Avg: '+avgHrs+'h'),
        React.createElement(View, { style:s.sleepBarWrap },
          weekData.map((d,i) =>
            React.createElement(View, { key:i, style:s.sleepBarCol },
              React.createElement(Text, { style:[s.barTopVal,{color: d.h>=d.goal ? successColor : errorColor, fontSize:9}] }, d.h+'h'),
              React.createElement(View, { style:[s.sleepBarBg,{backgroundColor:c.border}] },
                React.createElement(View, { style:[s.sleepBarFill,{
                  height: (d.h/10)*80,
                  backgroundColor: d.h>=d.goal ? successColor : d.h>=6 ? accentColor : errorColor
                }] }),
                // Goal line indicator
                React.createElement(View, { style:[s.goalLine,{bottom:(d.goal/10)*80, backgroundColor: c.primary+'60'}] })
              ),
              React.createElement(Text, { style:[s.barDayLbl,{color:c.textSecondary}] }, d.day),
              // Quality dot
              React.createElement(View, { style:[s.sleepQualDot,{backgroundColor: d.q>=8 ? successColor : d.q>=6 ? accentColor : errorColor}] })
            )
          )
        ),
        React.createElement(View, { style:s.sleepLegend },
          [
            {color:successColor, label:'≥8h (Goal met)'},
            {color:accentColor,  label:'6-8h (Fair)'},
            {color:errorColor,   label:'<6h (Poor)'},
          ].map((item,i) =>
            React.createElement(View, { key:i, style:s.legendItem },
              React.createElement(View, { style:[s.legendDot,{backgroundColor:item.color}] }),
              React.createElement(Text, { style:[s.legendTxt,{color:c.textSecondary}] }, item.label)
            )
          )
        )
      )
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROFILE SCREEN
  // ═══════════════════════════════════════════════════════════════════════════════
  const ProfileScreen = function() {
    const { theme, darkMode, toggleDarkMode } = useTheme();
    const { totalXP, level, goldCoins, habits } = useGlobal();
    const c = theme.colors;

    const xpInLevel = totalXP % 100;
    const xpToNext  = 100 - xpInLevel;
    const badges = [
      { name:'Early Bird',     icon:'wb-sunny',           earned:true  },
      { name:'Bookworm',       icon:'book',               earned:true  },
      { name:'Fitness Pro',    icon:'fitness-center',     earned:true  },
      { name:'Zen Master',     icon:'self-improvement',   earned:false },
      { name:'Sleep Champ',    icon:'bedtime',            earned:false },
      { name:'Water Hero',     icon:'local-drink',        earned:false },
    ];
    const longestStreak = Math.max(...habits.map(h=>h.streak));
    const stats = [
      { label:'Total Habits', value: habits.length, icon:'list',                  color: c.primary },
      { label:'Best Streak',  value: longestStreak+'d', icon:'local-fire-department', color:'#FF6B6B' },
      { label:'Total XP',     value: totalXP,       icon:'star',                  color: accentColor },
      { label:'Gold Coins',   value: goldCoins,     icon:'monetization-on',       color: goldCoinColor },
    ];

    return React.createElement(ScrollView, { style:[s.flex1,{backgroundColor:c.background}], contentContainerStyle:{padding:16,paddingBottom:100} },
      React.createElement(Text, { style:[s.screenTitle,{color:c.textPrimary}] }, '👤 Profile'),

      // Level Card
      React.createElement(View, { style:[s.levelCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(View, { style:s.avatarRing },
          React.createElement(View, { style:[s.avatar,{backgroundColor:c.primary+'30'}] },
            React.createElement(MaterialIcons, { name:'person', size:36, color:c.primary })
          )
        ),
        React.createElement(View, { style:s.flex1 },
          React.createElement(Text, { style:[s.levelNum,{color:c.textPrimary}] }, 'Level ' + level),
          React.createElement(Text, { style:[s.levelXP,{color:c.textSecondary}] }, totalXP+' XP · '+xpToNext+' to next'),
          React.createElement(View, { style:[s.xpTrack,{backgroundColor:c.border}] },
            React.createElement(View, { style:[s.xpFill,{width:(xpInLevel)+'%',backgroundColor:c.primary}] })
          )
        )
      ),

      // Stats Grid
      React.createElement(View, { style:s.statsGrid },
        stats.map((st,i) =>
          React.createElement(View, { key:i, style:[s.statCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
            React.createElement(MaterialIcons, { name:st.icon, size:22, color:st.color }),
            React.createElement(Text, { style:[s.statVal,{color:c.textPrimary}] }, st.value),
            React.createElement(Text, { style:[s.statLbl,{color:c.textSecondary}] }, st.label)
          )
        )
      ),

      // Badges
      React.createElement(View, { style:[s.chartCard,{backgroundColor:c.card,borderColor:c.cardBorder}] },
        React.createElement(Text, { style:[s.sectionTitle,{color:c.textPrimary}] }, '🏆 Achievements'),
        React.createElement(View, { style:s.badgesWrap },
          badges.map((b,i) =>
            React.createElement(View, { key:i, style:[s.badgeItem,{
              backgroundColor: b.earned ? c.primary+'20' : c.background,
              borderColor: b.earned ? c.primary+'60' : c.border,
              opacity: b.earned ? 1 : 0.5
            }] },
              React.createElement(MaterialIcons, { name:b.icon, size:26, color: b.earned ? c.primary : c.textSecondary }),
              React.createElement(Text, { style:[s.badgeName,{color: b.earned ? c.textPrimary : c.textSecondary}] }, b.name)
            )
          )
        )
      ),

      // Dark Mode Toggle
      React.createElement(TouchableOpacity, {
        style:[s.darkToggle,{backgroundColor:c.card,borderColor:c.cardBorder}],
        onPress:toggleDarkMode
      },
        React.createElement(MaterialIcons, { name: darkMode ? 'light-mode' : 'dark-mode', size:22, color:c.primary }),
        React.createElement(Text, { style:[s.darkToggleTxt,{color:c.textPrimary}] }, darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')
      )
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════════════════════════
  const s = StyleSheet.create({
    flex1:       { flex:1 },
    px16:        { paddingHorizontal:16 },
    mb12:        { marginBottom:12 },
    mb16:        { marginBottom:16 },
    mt8:         { marginTop:8 },
    ml8:         { marginLeft:8 },
    row:         { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8 },
    rowCenter:   { flexDirection:'row', alignItems:'center' },
    alignCenter: { alignItems:'center' },

    // ── Quote Banner ──
    quoteBanner:     { flexDirection:'row', alignItems:'flex-start', padding:14, borderRadius:12, gap:8, marginBottom:4 },
    quoteBannerText: { flex:1, fontSize:13, fontStyle:'italic', lineHeight:20 },
    miniQuote:       { textAlign:'center', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:16 },

    // ── Home Header ──
    homeHeader:   { flexDirection:'row', alignItems:'center', padding:16, borderRadius:16, borderWidth:1, marginBottom:16 },
    greeting:     { fontSize:22, fontWeight:'800', letterSpacing:-0.5 },
    greetingSub:  { fontSize:13, marginTop:2, marginBottom:8 },
    pill:         { flexDirection:'row', alignItems:'center', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
    pillText:     { fontSize:12, fontWeight:'700' },

    // ── Ring ──
    ringWrap:     { width:90, height:90, alignItems:'center', justifyContent:'center' },
    ringOuter:    { position:'absolute', width:84, height:84, borderRadius:42, borderWidth:6, opacity:0.2 },
    ringInner:    { position:'absolute', width:84, height:84, borderRadius:42, borderWidth:6, borderRightColor:'transparent', borderBottomColor:'transparent', transform:[{rotate:'45deg'}] },
    ringCenter:   { alignItems:'center' },
    ringPct:      { fontSize:20, fontWeight:'800' },
    ringLbl:      { fontSize:10 },

    // ── Progress Bar ──
    progressTrack:   { height:6, borderRadius:3, overflow:'hidden', marginBottom:6 },
    progressFill:    { height:'100%', borderRadius:3 },
    progressCaption: { fontSize:12, textAlign:'center' },

    // ── Section Title ──
    sectionTitle: { fontSize:18, fontWeight:'800', marginBottom:14, letterSpacing:-0.3 },
    screenTitle:  { fontSize:26, fontWeight:'900', textAlign:'center', marginBottom:20, letterSpacing:-0.5 },

    // ── Habit Row ──
    habitRow:     { flexDirection:'row', alignItems:'center', padding:14, borderRadius:14, gap:10 },
    checkbox:     { width:22, height:22, borderRadius:6, borderWidth:2, alignItems:'center', justifyContent:'center' },
    habitIconBg:  { width:38, height:38, borderRadius:10, alignItems:'center', justifyContent:'center' },
    habitName:    { fontSize:15, fontWeight:'700' },
    habitCat:     { fontSize:11, marginTop:2 },
    habitRight:   { alignItems:'flex-end', gap:4 },
    streakNum:    { fontSize:12, fontWeight:'800' },
    xpTag:        { fontSize:11, fontWeight:'600' },

    // ── Timer Screen ──
    timerFull:       { alignItems:'center', paddingVertical:8 },
    fullscreenTimer: { flex:1, alignItems:'center', justifyContent:'center' },
    presetRow:       { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:20 },
    presetChip:      { paddingHorizontal:14, paddingVertical:8, borderRadius:20 },
    presetLabel:     { fontSize:13, fontWeight:'700' },
    customRow:       { flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
    customInput:     { borderWidth:1, borderRadius:10, padding:10, fontSize:18, width:90, textAlign:'center', fontWeight:'700' },
    customUnit:      { fontSize:14 },
    timerRingWrap:   { width:240, height:240, alignItems:'center', justifyContent:'center', marginVertical:24, shadowOffset:{width:0,height:0} },
    timerRingOuter:  { position:'absolute', width:220, height:220, borderRadius:110, borderWidth:8 },
    timerRingProgress:{ position:'absolute', width:220, height:220, borderRadius:110, borderWidth:8 },
    timerRingInner:  { alignItems:'center', justifyContent:'center' },
    timerDisplay:    { fontWeight:'900', fontFamily: Platform.OS==='web'?'monospace':'Courier New', letterSpacing:4 },
    timerSubLabel:   { fontSize:13, fontWeight:'700', marginTop:6 },
    focusHint:       { fontSize:11, marginTop:8 },
    doneWrap:        { alignItems:'center' },
    doneText:        { fontSize:20, fontWeight:'800', marginTop:8 },
    coinEarned:      { fontSize:16, fontWeight:'700', marginTop:4 },
    timerControls:   { flexDirection:'row', gap:12, marginBottom:24 },
    timerBtn:        { flexDirection:'row', alignItems:'center', paddingHorizontal:18, paddingVertical:12, borderRadius:14, gap:6 },
    timerBtnPrimary: {},
    timerBtnOutline: { borderWidth:1.5 },
    timerBtnText:    { color:'#fff', fontSize:14, fontWeight:'700' },
    coinInfoCard:    { width:'100%', flexDirection:'row', alignItems:'center', padding:14, borderRadius:14, borderWidth:1 },
    coinCardTitle:   { fontSize:14, fontWeight:'700', marginBottom:2 },
    coinCardSub:     { fontSize:11 },
    coinBal:         { alignItems:'center', marginLeft:12 },
    coinBalNum:      { fontSize:22, fontWeight:'900' },
    coinBalLabel:    { fontSize:10 },

    // ── Add Habit ──
    formCard:       { borderRadius:16, borderWidth:1, padding:16, marginBottom:16 },
    formLabel:      { fontSize:14, fontWeight:'700', marginBottom:8 },
    formInput:      { borderWidth:1, borderRadius:10, padding:12, fontSize:15 },
    iconSelector:   { flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:10, padding:12, gap:12 },
    iconPreview:    { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
    iconSelectorTxt:{ flex:1, fontSize:14 },
    catWrap:        { flexDirection:'row', flexWrap:'wrap', gap:8 },
    catChip:        { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5 },
    catChipTxt:     { fontSize:13, fontWeight:'600' },
    saveBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:16, borderRadius:14, gap:8 },
    saveBtnTxt:     { color:'#fff', fontSize:16, fontWeight:'800' },
    habitsCount:    { textAlign:'center', marginTop:12, fontSize:12 },
    modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    iconModal:      { borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60%' },
    modalHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1 },
    modalTitle:     { fontSize:18, fontWeight:'800' },
    iconOpt:        { width:(screenWidth-64)/5, height:56, alignItems:'center', justifyContent:'center', margin:4, borderRadius:10, borderWidth:1 },

    // ── Progress ──
    summaryRow:   { flexDirection:'row', gap:10, marginBottom:16 },
    summaryCard:  { flex:1, alignItems:'center', padding:12, borderRadius:14, borderWidth:1, gap:4 },
    summaryNum:   { fontSize:20, fontWeight:'900' },
    summaryLbl:   { fontSize:11 },
    chartCard:    { borderRadius:16, borderWidth:1, padding:16, marginBottom:16 },
    chartTitle:   { fontSize:16, fontWeight:'800', marginBottom:4, textAlign:'center' },
    chartSubtitle:{ fontSize:11, textAlign:'center', marginBottom:12 },
    barChartWrap: { flexDirection:'row', alignItems:'flex-end', height:130, gap:4, paddingTop:20 },
    barCol:       { flex:1, alignItems:'center' },
    barBg:        { width:22, height:90, borderRadius:6, overflow:'hidden', justifyContent:'flex-end' },
    barFill:      { borderRadius:6 },
    barTopVal:    { fontSize:10, fontWeight:'800', marginBottom:4 },
    barDayLbl:    { fontSize:10, marginTop:6 },
    catPieWrap:   { width:'100%' },
    catBarsCol:   { gap:10 },
    catBarRow:    { flexDirection:'row', alignItems:'center', gap:8 },
    catBarLabel:  { width:70, fontSize:12, fontWeight:'600' },
    catBarTrack:  { flex:1, height:8, borderRadius:4, overflow:'hidden' },
    catBarFill:   { height:'100%', borderRadius:4 },
    catBarCount:  { width:20, fontSize:12, fontWeight:'800', textAlign:'right' },
    rankRow:      { flexDirection:'row', gap:10 },
    rankCard:     { flex:1, padding:14, borderRadius:14, borderWidth:1, gap:10 },
    rankTitle:    { fontSize:13, fontWeight:'800' },
    rankItem:     { gap:2 },
    rankName:     { fontSize:13, fontWeight:'600' },
    rankStat:     { fontSize:11 },

    // ── Sleep ──
    sleepCard:     { borderRadius:16, borderWidth:1, padding:16, marginBottom:16 },
    sleepTimeRow:  { flexDirection:'row', alignItems:'center', marginBottom:16 },
    sleepTimeCol:  { flex:1, alignItems:'center', gap:8 },
    sleepArrow:    { paddingHorizontal:8 },
    sleepTimeLabel:{ fontSize:13, fontWeight:'700' },
    sleepTimeInput:{ borderWidth:1, borderRadius:10, padding:10, fontSize:20, width:'90%', textAlign:'center', fontWeight:'800' },
    durationBadge: { alignItems:'center', padding:12, borderRadius:12, marginBottom:16 },
    durationVal:   { fontSize:28, fontWeight:'900' },
    durationLbl:   { fontSize:11, marginTop:2 },
    qualityTitle:  { fontSize:14, fontWeight:'700', textAlign:'center', marginBottom:12 },
    qualityDots:   { flexDirection:'row', justifyContent:'center', gap:8 },
    qualDot:       { width:24, height:24, borderRadius:12 },
    sleepBarWrap:  { flexDirection:'row', alignItems:'flex-end', height:140, gap:4, paddingTop:24 },
    sleepBarCol:   { flex:1, alignItems:'center' },
    sleepBarBg:    { width:22, height:80, borderRadius:6, overflow:'visible', justifyContent:'flex-end', position:'relative' },
    sleepBarFill:  { borderRadius:6 },
    goalLine:      { position:'absolute', left:-4, right:-4, height:2, borderRadius:1 },
    sleepQualDot:  { width:7, height:7, borderRadius:4, marginTop:4 },
    sleepLegend:   { flexDirection:'row', flexWrap:'wrap', gap:12, marginTop:12, justifyContent:'center' },
    legendItem:    { flexDirection:'row', alignItems:'center', gap:4 },
    legendDot:     { width:8, height:8, borderRadius:4 },
    legendTxt:     { fontSize:11 },

    // ── Profile ──
    levelCard:     { flexDirection:'row', alignItems:'center', gap:16, padding:20, borderRadius:16, borderWidth:1, marginBottom:16 },
    avatarRing:    { width:64, height:64, borderRadius:32, borderWidth:2, borderColor: primaryColor+'40', alignItems:'center', justifyContent:'center' },
    avatar:        { width:56, height:56, borderRadius:28, alignItems:'center', justifyContent:'center' },
    levelNum:      { fontSize:20, fontWeight:'900' },
    levelXP:       { fontSize:12, marginTop:2, marginBottom:8 },
    xpTrack:       { height:6, borderRadius:3, overflow:'hidden' },
    xpFill:        { height:'100%', borderRadius:3 },
    statsGrid:     { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
    statCard:      { width:(screenWidth-52)/2, padding:14, borderRadius:14, borderWidth:1, alignItems:'center', gap:4 },
    statVal:       { fontSize:22, fontWeight:'900' },
    statLbl:       { fontSize:11 },
    badgesWrap:    { flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:8 },
    badgeItem:     { width:(screenWidth-72)/3, padding:12, borderRadius:12, borderWidth:1.5, alignItems:'center', gap:6 },
    badgeName:     { fontSize:10, fontWeight:'700', textAlign:'center' },
    darkToggle:    { flexDirection:'row', alignItems:'center', gap:12, padding:16, borderRadius:14, borderWidth:1, marginTop:8 },
    darkToggleTxt: { fontSize:15, fontWeight:'600' },
  });

  // ─── TAB NAVIGATOR ────────────────────────────────────────────────────────────
  const Navigator = function() {
    const { theme } = useTheme();
    const c = theme.colors;

    return React.createElement(Tab.Navigator, {
      screenOptions: {
        headerShown: false,
        tabBarStyle: {
          position:'absolute', bottom:0,
          backgroundColor: c.card,
          borderTopColor: c.cardBorder,
          borderTopWidth: 1,
          paddingBottom: Platform.OS==='ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS==='ios' ? 80 : 62
        },
        tabBarActiveTintColor:   c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: { fontSize:9, fontWeight:'700', letterSpacing:0.5 }
      }
    },
      React.createElement(Tab.Screen, { name:'Home', component:HomeScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'home',size:24,color}) }
      }),
      React.createElement(Tab.Screen, { name:'Timer', component:TimerScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'timer',size:24,color}) }
      }),
      React.createElement(Tab.Screen, { name:'Add', component:AddHabitScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'add-circle',size:24,color}) }
      }),
      React.createElement(Tab.Screen, { name:'Progress', component:ProgressScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'bar-chart',size:24,color}) }
      }),
      React.createElement(Tab.Screen, { name:'Sleep', component:SleepScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'bedtime',size:24,color}) }
      }),
      React.createElement(Tab.Screen, { name:'Profile', component:ProfileScreen,
        options:{ tabBarIcon:({color})=>React.createElement(MaterialIcons,{name:'person',size:24,color}) }
      })
    );
  };

  // ─── ROOT ─────────────────────────────────────────────────────────────────────
  return React.createElement(ThemeProvider, null,
    React.createElement(GlobalProvider, null,
      React.createElement(View, { style:{ flex:1, width:'100%', height:'100%' } },
        React.createElement(StatusBar, { barStyle:'light-content', backgroundColor: backgroundColor }),
        React.createElement(Navigator)
      )
    )
  );
};
return ComponentFunction;
