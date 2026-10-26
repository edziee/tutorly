const subjectRules = [
  {
    label: 'Computer Science & IT',
    codePrefixes: ['CSCI', 'COMP', 'COMPSCI', 'CS', 'IT', 'ICT', 'CIS', 'INFO', 'PROG', 'SWE'],
    titlePattern: /\b(computer science|information technology|programming|software|coding|data structures|algorithms|cybersecurity|database|web development)\b/i,
  },
  {
    label: 'Mathematics & Statistics',
    codePrefixes: ['MATH', 'MAT', 'STAT'],
    titlePattern: /\b(mathematics|math|calculus|algebra|geometry|trigonometry|statistics|probability|number theory)\b/i,
  },
  {
    label: 'Natural Sciences',
    codePrefixes: ['PHYS', 'PHY', 'CHEM', 'BIO', 'BIOL'],
    titlePattern: /\b(physics|chemistry|biology|natural science|botany|zoology|ecology|astronomy|geology)\b/i,
  },
  {
    label: 'Engineering',
    codePrefixes: ['ENGR', 'EGR', 'ECE', 'EE'],
    titlePattern: /\b(engineering|mechanics|electronics|electrical circuits|thermodynamics|materials science)\b/i,
  },
  {
    label: 'Business & Economics',
    codePrefixes: ['BUS', 'ACCT', 'ACC', 'ECON', 'FIN', 'MGT', 'MGMT'],
    titlePattern: /\b(business|accounting|accountancy|economics|finance|marketing|management|entrepreneurship)\b/i,
  },
  {
    label: 'Languages & Communication',
    codePrefixes: ['ENG', 'ENGL', 'FIL', 'LANG', 'LIT', 'COMM'],
    titlePattern: /\b(english|filipino|language|literature|writing|communication|linguistics|spanish|japanese|korean)\b/i,
  },
  {
    label: 'Social Sciences & Humanities',
    codePrefixes: ['PSY', 'PSYC', 'SOC', 'SOCIO', 'HIST', 'POLSCI', 'ANTH', 'PHIL'],
    titlePattern: /\b(psychology|sociology|history|political science|anthropology|philosophy|humanities|geography)\b/i,
  },
];

export const OTHER_SUBJECT_LABEL = 'Other';

const getCourseParts = (courseName) => {
  const separatorIndex = courseName.indexOf(':');
  if (separatorIndex < 0) {
    const isCourseCodeOnly = /^[A-Za-z]{2,}[A-Za-z0-9-]*\s*\d+[A-Za-z0-9-]*$/.test(courseName);
    return {
      code: isCourseCodeOnly ? courseName.toUpperCase().replace(/[^A-Z0-9]/g, '') : '',
      title: isCourseCodeOnly ? '' : courseName,
    };
  }

  const [code = '', ...titleParts] = courseName.split(':');
  return {
    code: code.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
    title: titleParts.join(':').trim(),
  };
};

export function getSubjectForCourse(courseName) {
  if (typeof courseName !== 'string' || !courseName.trim()) return OTHER_SUBJECT_LABEL;

  const { code, title } = getCourseParts(courseName.trim());
  const codeRule = subjectRules.find(({ codePrefixes }) =>
    codePrefixes.some((prefix) => code.startsWith(prefix)));
  const isAmbiguousEnglishCode = code.startsWith('ENG') && !code.startsWith('ENGR');
  if (codeRule && !isAmbiguousEnglishCode) return codeRule.label;

  const titleRule = subjectRules.find(({ titlePattern }) => titlePattern.test(title));
  if (titleRule) return titleRule.label;

  return codeRule?.label ?? OTHER_SUBJECT_LABEL;
}

export function tutorMatchesSubject(courseNames, selectedSubject) {
  const normalizedSubject = typeof selectedSubject === 'string'
    ? selectedSubject.trim().toLowerCase()
    : '';
  return !normalizedSubject || courseNames.some((courseName) =>
    getSubjectForCourse(courseName).toLowerCase() === normalizedSubject);
}

export function getAvailableSubjectFilters(courseNames) {
  const available = new Set(courseNames.map(getSubjectForCourse));
  return [
    { id: 'all-subjects', keyword: '', label: 'All Subjects' },
    ...subjectRules
      .filter(({ label }) => available.has(label))
      .map(({ label }) => ({ id: label, keyword: label, label })),
    ...(available.has(OTHER_SUBJECT_LABEL)
      ? [{ id: OTHER_SUBJECT_LABEL, keyword: OTHER_SUBJECT_LABEL, label: OTHER_SUBJECT_LABEL }]
      : []),
  ];
}
