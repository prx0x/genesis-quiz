const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');
const config = require('../config');

const DEMO_QUESTIONS = [
  {
    questionText: '[DEMO] Which protocol is used for secure web communication?',
    type: 'single_choice',
    options: [
      { id: 'A', text: 'HTTP' },
      { id: 'B', text: 'HTTPS' },
      { id: 'C', text: 'FTP' },
      { id: 'D', text: 'SMTP' },
    ],
    correctAnswers: ['B'],
    explanation: 'HTTPS encrypts traffic using TLS.',
    marks: 1,
    negativeMarks: 0.25,
    order: 1,
    status: 'published',
  },
  {
    questionText: '[DEMO] Which of the following are programming languages? (Select all that apply)',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: 'Python' },
      { id: 'B', text: 'HTML' },
      { id: 'C', text: 'JavaScript' },
      { id: 'D', text: 'CSS' },
    ],
    correctAnswers: ['A', 'C'],
    explanation: 'Python and JavaScript are programming languages. HTML and CSS are markup/style languages.',
    marks: 1,
    negativeMarks: 0.25,
    order: 2,
    status: 'published',
  },
  {
    questionText: '[DEMO] The time complexity of binary search is O(log n).',
    type: 'true_false',
    options: [
      { id: 'true', text: 'TRUE' },
      { id: 'false', text: 'FALSE' },
    ],
    correctAnswers: ['true'],
    explanation: 'Binary search halves the search space each step.',
    marks: 1,
    negativeMarks: 0.25,
    order: 3,
    status: 'published',
  },
  {
    questionText: '[DEMO] Which data structure uses FIFO ordering?',
    type: 'single_choice',
    options: [
      { id: 'A', text: 'Stack' },
      { id: 'B', text: 'Queue' },
      { id: 'C', text: 'Tree' },
      { id: 'D', text: 'Graph' },
    ],
    correctAnswers: ['B'],
    explanation: 'Queues follow First-In-First-Out.',
    marks: 1,
    negativeMarks: 0.25,
    order: 4,
    status: 'published',
  },
  {
    questionText: '[DEMO] React is a JavaScript library for building user interfaces.',
    type: 'true_false',
    options: [
      { id: 'true', text: 'TRUE' },
      { id: 'false', text: 'FALSE' },
    ],
    correctAnswers: ['true'],
    explanation: 'React is maintained by Meta and the community.',
    marks: 1,
    negativeMarks: 0,
    order: 5,
    status: 'draft',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    const settingsCount = await query('SELECT COUNT(*)::int AS c FROM quiz_settings');
    if (settingsCount.rows[0].c === 0) {
      await query(
        `INSERT INTO quiz_settings (
          title, description, duration_minutes, total_questions,
          default_marks, default_negative_marks,
          allow_navigation, randomize_questions, randomize_options,
          show_results, show_correct_answers, allow_retry
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          'GENESIS 4.0 Quiz',
          'An event quiz for GENESIS 4.0.',
          30,
          5,
          1,
          0.25,
          true,
          false,
          false,
          true,
          false,
          false,
        ]
      );
      console.log('Created quiz settings.');
    }

    if (config.admin.username && config.admin.password) {
      const existing = await query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND role = 'admin'`,
        [`${config.admin.username}@admin.local`]
      );
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(config.admin.password, 12);
        await query(
          `INSERT INTO users (email, name, email_verified, role, password_hash)
           VALUES ($1, $2, true, 'admin', $3)`,
          [`${config.admin.username}@admin.local`, 'Quiz Administrator', hash]
        );
        console.log(`Created admin user: ${config.admin.username}`);
      } else {
        console.log('Admin user already exists.');
      }
    }

    const qCount = await query(
      `SELECT COUNT(*)::int AS c FROM questions WHERE deleted_at IS NULL`
    );
    if (qCount.rows[0].c === 0) {
      for (const q of DEMO_QUESTIONS) {
        await query(
          `INSERT INTO questions (
            question_text, type, options, correct_answers, explanation,
            marks, negative_marks, "order", status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            q.questionText,
            q.type,
            JSON.stringify(q.options),
            JSON.stringify(q.correctAnswers),
            q.explanation,
            q.marks,
            q.negativeMarks,
            q.order,
            q.status,
          ]
        );
      }
      console.log(`Inserted ${DEMO_QUESTIONS.length} DEMO questions.`);

      const published = await query(
        `SELECT COUNT(*)::int AS c FROM questions WHERE status = 'published' AND deleted_at IS NULL`
      );
      await query(
        `UPDATE quiz_settings SET total_questions = $1, updated_at = NOW()`,
        [published.rows[0].c]
      );
    } else {
      console.log('Questions already exist; skipping demo seed.');
    }

    console.log('Seed completed.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
