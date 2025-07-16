const fs = require('fs');
const path = require('path');

console.log('🔧 NEON SPIN - Workspace Optimization Check\n');
console.log('='.repeat(70));

class WorkspaceOptimizer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.fileChecks = 0;
    this.passedChecks = 0;
  }

  // Check if file exists and log result
  checkFile(filePath, description, required = true) {
    this.fileChecks++;
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      this.passedChecks++;
      console.log(`✅ ${description}: ${filePath}`);
      return true;
    } else {
      const message = `${description}: ${filePath}`;
      if (required) {
        this.errors.push(message);
        console.log(`❌ ${message}`);
      } else {
        this.warnings.push(message);
        console.log(`⚠️ ${message}`);
      }
      return false;
    }
  }

  // Check file content for specific patterns
  checkFileContent(filePath, patterns, description) {
    if (!fs.existsSync(filePath)) {
      this.errors.push(`Cannot check ${description} - file missing: ${filePath}`);
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const results = {};
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        if (typeof pattern === 'string') {
          results[key] = content.includes(pattern);
        } else if (pattern instanceof RegExp) {
          results[key] = pattern.test(content);
        }
      });

      console.log(`\n📄 ${description} (${filePath}):`);
      Object.entries(results).forEach(([key, found]) => {
        console.log(`  ${found ? '✅' : '❌'} ${key}`);
        if (!found) {
          this.warnings.push(`${description}: Missing ${key}`);
        }
      });

      return results;
    } catch (err) {
      this.errors.push(`Error reading ${filePath}: ${err.message}`);
      return false;
    }
  }

  // Check directory structure
  checkDirectoryStructure() {
    console.log('\n📁 DIRECTORY STRUCTURE CHECK');
    console.log('-'.repeat(50));

    const requiredDirs = [
      { path: 'public', desc: 'Public assets directory' },
      { path: 'public/css', desc: 'CSS files' },
      { path: 'public/css/components', desc: 'Component CSS files' },
      { path: 'public/js', desc: 'JavaScript files' },
      { path: 'public/images', desc: 'Image assets' },
      { path: 'public/images/symbols', desc: 'Slot machine symbols' },
      { path: 'public/images/frames', desc: 'Avatar frames' },
      { path: 'public/images/badges', desc: 'Achievement badges' },
      { path: 'public/images/avatars', desc: 'User avatars' },
      { path: 'public/sounds', desc: 'Audio files' },
      { path: 'views', desc: 'HTML templates' },
      { path: 'routes', desc: 'Express routes' },
      { path: 'controllers', desc: 'Route controllers' },
      { path: 'models', desc: 'Database models' },
      { path: 'middleware', desc: 'Express middleware' },
      { path: 'config', desc: 'Configuration files' },
      { path: 'scripts', desc: 'Utility scripts' }
    ];

    requiredDirs.forEach(dir => {
      this.checkFile(dir.path, dir.desc);
    });
  }

  // Check core application files
  checkCoreFiles() {
    console.log('\n🔧 CORE APPLICATION FILES');
    console.log('-'.repeat(50));

    const coreFiles = [
      { path: 'package.json', desc: 'Package configuration' },
      { path: 'server.js', desc: 'Main server file' },
      { path: '.env.example', desc: 'Environment template' },
      { path: '.gitignore', desc: 'Git ignore rules' },
      { path: 'README.md', desc: 'Documentation' }
    ];

    coreFiles.forEach(file => {
      this.checkFile(file.path, file.desc);
    });

    // Check if .env exists (should not be in repo)
    if (fs.existsSync('.env')) {
      console.log('⚠️ .env file exists (should not be in repository)');
      this.warnings.push('.env file should not be committed to repository');
    }
  }

  // Check asset files
  checkAssets() {
    console.log('\n🎨 ASSET FILES CHECK');
    console.log('-'.repeat(50));

    // Slot machine symbols
    const symbols = ['cherry', 'lemon', 'orange', 'bell', 'bar', 'seven', 'diamond', 'plum'];
    symbols.forEach(symbol => {
      this.checkFile(`public/images/symbols/${symbol}.svg`, `Symbol: ${symbol}`);
    });

    // Avatar frames
    const frames = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    frames.forEach(frame => {
      this.checkFile(`public/images/frames/${frame}.svg`, `Frame: ${frame}`);
    });

    // Badges
    const badges = ['winner', 'jackpot', 'streak', 'high-roller'];
    badges.forEach(badge => {
      this.checkFile(`public/images/badges/${badge}.svg`, `Badge: ${badge}`);
    });

    // Default avatar
    this.checkFile('public/images/avatars/default.svg', 'Default avatar');

    // Favicon files
    const faviconFiles = [
      'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 
      'apple-touch-icon.png', 'site.webmanifest'
    ];
    faviconFiles.forEach(file => {
      this.checkFile(`public/${file}`, `Favicon: ${file}`, false);
    });
  }

  // Check JavaScript files
  checkJavaScriptFiles() {
    console.log('\n📜 JAVASCRIPT FILES CHECK');
    console.log('-'.repeat(50));

    const jsFiles = [
      'public/js/slot-machine.js',
      'public/js/auth.js',
      'public/js/profile.js',
      'public/js/rewards.js',
      'public/js/boosters.js',
      'public/js/leaderboard.js',
      'public/js/audio-manager.js',
      'public/js/mobile-nav.js',
      'public/js/avatar-decorations.js',
      'public/js/reward-notification.js',
      'public/js/theme.js'
    ];

    jsFiles.forEach(file => {
      this.checkFile(file, `JavaScript: ${path.basename(file)}`);
    });

    // Check for common JavaScript patterns
    if (fs.existsSync('public/js/slot-machine.js')) {
      this.checkFileContent('public/js/slot-machine.js', {
        'SYMBOLS array': /const\s+SYMBOLS\s*=/,
        'Spin function': /spin|Spin/,
        'Audio integration': /AudioManager|audio/i,
        'Symbol rendering': /renderSymbol|symbol.*render/i
      }, 'Slot Machine JS');
    }

    if (fs.existsSync('public/js/auth.js')) {
      this.checkFileContent('public/js/auth.js', {
        'Login function': /login/i,
        'Token handling': /token/i,
        'API calls': /fetch|axios/i
      }, 'Authentication JS');
    }
  }

  // Check CSS files
  checkCSSFiles() {
    console.log('\n🎨 CSS FILES CHECK');
    console.log('-'.repeat(50));

    const cssFiles = [
      'public/css/style.css',
      'public/css/mobile.css',
      'public/css/themes.css',
      'public/css/global-avatar-decorations.css',
      'public/css/components/audio-controls.css',
      'public/css/components/rewards.css'
    ];

    cssFiles.forEach(file => {
      this.checkFile(file, `CSS: ${path.basename(file)}`);
    });

    // Check main CSS for key components
    if (fs.existsSync('public/css/style.css')) {
      this.checkFileContent('public/css/style.css', {
        'Slot machine styles': /slot.*machine|reel/i,
        'Neon effects': /neon|glow|shadow/i,
        'Responsive design': /@media/,
        'Button styles': /\.btn|button/,
        'Color scheme': /#00ffff|cyan|neon/i
      }, 'Main CSS');
    }
  }

  // Check HTML files
  checkHTMLFiles() {
    console.log('\n📄 HTML FILES CHECK');
    console.log('-'.repeat(50));

    const htmlFiles = [
      'views/index.html',
      'views/login.html',
      'views/register.html',
      'views/profile.html',
      'views/leaderboard.html',
      'views/rewards.html',
      'views/boosters.html'
    ];

    htmlFiles.forEach(file => {
      this.checkFile(file, `HTML: ${path.basename(file)}`);
    });

    // Check HTML files for consistency
    htmlFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.checkFileContent(file, {
          'Favicon links': /favicon/i,
          'Font Awesome': /fontawesome|fa-/i,
          'Orbitron font': /Orbitron/i,
          'Mobile viewport': /viewport.*width=device-width/i,
          'Theme support': /theme\.js/i,
          'Mobile navigation': /mobile-nav\.js/i
        }, `HTML: ${path.basename(file)}`);
      }
    });
  }

  // Check backend files
  checkBackendFiles() {
    console.log('\n🖥️ BACKEND FILES CHECK');
    console.log('-'.repeat(50));

    // Controllers
    const controllers = [
      'controllers/authController.js',
      'controllers/userController.js',
      'controllers/slotController.js'
    ];

    controllers.forEach(file => {
      this.checkFile(file, `Controller: ${path.basename(file)}`);
    });

    // Routes
    const routes = [
      'routes/auth.js',
      'routes/users.js',
      'routes/slots.js'
    ];

    routes.forEach(file => {
      this.checkFile(file, `Route: ${path.basename(file)}`);
    });

    // Models
    const models = [
      'models/User.js',
      'models/Jackpot.js'
    ];

    models.forEach(file => {
      this.checkFile(file, `Model: ${path.basename(file)}`);
    });

    // Config
    const configs = [
      'config/database.js',
      'config/multer.js'
    ];

    configs.forEach(file => {
      this.checkFile(file, `Config: ${path.basename(file)}`);
    });

    // Middleware
    this.checkFile('middleware/auth.js', 'Auth middleware');
  }

  // Check package.json for dependencies
  checkDependencies() {
    console.log('\n📦 DEPENDENCIES CHECK');
    console.log('-'.repeat(50));

    if (!fs.existsSync('package.json')) {
      this.errors.push('package.json is missing');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredDeps = [
        'express',
        'mongoose',
        'bcryptjs',
        'jsonwebtoken',
        'multer',
        'express-session',
        'cors'
      ];

      const devDeps = [
        'nodemon'
      ];

      console.log('Required dependencies:');
      requiredDeps.forEach(dep => {
        const hasMain = packageJson.dependencies && packageJson.dependencies[dep];
        const hasDev = packageJson.devDependencies && packageJson.devDependencies[dep];
        
        if (hasMain || hasDev) {
          console.log(`  ✅ ${dep}`);
        } else {
          console.log(`  ❌ ${dep} - MISSING`);
          this.errors.push(`Missing dependency: ${dep}`);
        }
      });

      console.log('\nDevelopment dependencies:');
      devDeps.forEach(dep => {
        const hasDev = packageJson.devDependencies && packageJson.devDependencies[dep];
        
        if (hasDev) {
          console.log(`  ✅ ${dep}`);
        } else {
          console.log(`  ⚠️ ${dep} - RECOMMENDED`);
          this.warnings.push(`Recommended dev dependency: ${dep}`);
        }
      });

      // Check scripts
      console.log('\nPackage scripts:');
      const recommendedScripts = {
        'start': 'node server.js',
        'dev': 'nodemon server.js',
        'test:assets': 'node scripts/start-asset-test.js'
      };

      Object.entries(recommendedScripts).forEach(([script, command]) => {
        const hasScript = packageJson.scripts && packageJson.scripts[script];
        if (hasScript) {
          console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
        } else {
          console.log(`  ⚠️ ${script} - MISSING`);
          this.suggestions.push(`Add script "${script}": "${command}"`);
        }
      });

    } catch (err) {
      this.errors.push(`Error reading package.json: ${err.message}`);
    }
  }

  // Check for common issues
  checkCommonIssues() {
    console.log('\n🔍 COMMON ISSUES CHECK');
    console.log('-'.repeat(50));

    // Check for mixed file extensions
    const htmlInPublic = fs.existsSync('public/index.html');
    const htmlInViews = fs.existsSync('views/index.html');
    
    if (htmlInPublic && htmlInViews) {
      this.warnings.push('HTML files found in both public/ and views/ - potential conflict');
      console.log('⚠️ HTML files in both public/ and views/ directories');
    }

    // Check for old/unused files
    const potentialOldFiles = [
      'public/index.html',
      'public/login.html',
      'public/register.html',
      'uploads/',
      'node_modules/.cache',
      '.DS_Store'
    ];

    potentialOldFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`⚠️ Potential cleanup needed: ${file}`);
        this.warnings.push(`Potential cleanup needed: ${file}`);
      }
    });

    // Check for inconsistent file naming
    this.checkFileNaming();
    
    // Check for duplicate dependencies
    this.checkDuplicateDependencies();
    
    // Check for security issues
    this.checkSecurityIssues();
  }

  // Check file naming consistency
  checkFileNaming() {
    console.log('\n📝 FILE NAMING CONSISTENCY');
    console.log('-'.repeat(50));

    // Check for inconsistent naming patterns
    const jsFiles = fs.readdirSync('public/js').filter(f => f.endsWith('.js'));
    const kebabCasePattern = /^[a-z]+(-[a-z]+)*\.js$/;
    
    jsFiles.forEach(file => {
      if (!kebabCasePattern.test(file)) {
        console.log(`⚠️ Non-kebab-case JS file: ${file}`);
        this.warnings.push(`Consider renaming ${file} to kebab-case`);
      }
    });

    // Check for mixed image extensions
    if (fs.existsSync('public/images/symbols')) {
      const symbolFiles = fs.readdirSync('public/images/symbols');
      const extensions = [...new Set(symbolFiles.map(f => path.extname(f)))];
      
      if (extensions.length > 1) {
        console.log(`⚠️ Mixed image extensions in symbols: ${extensions.join(', ')}`);
        this.warnings.push('Consider using consistent image format for symbols');
      }
    }
  }

  // Check for duplicate dependencies
  checkDuplicateDependencies() {
    if (!fs.existsSync('package.json')) return;

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      
      const duplicates = Object.keys(deps).filter(dep => devDeps[dep]);
      
      if (duplicates.length > 0) {
        console.log(`⚠️ Duplicate dependencies found: ${duplicates.join(', ')}`);
        duplicates.forEach(dep => {
          this.warnings.push(`${dep} exists in both dependencies and devDependencies`);
        });
      }
    } catch (err) {
      // Already handled in checkDependencies
    }
  }

  // Check for security issues
  checkSecurityIssues() {
    console.log('\n🔒 SECURITY CHECKS');
    console.log('-'.repeat(50));

    // Check if .env is in .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env')) {
        console.log('❌ .env not found in .gitignore');
        this.errors.push('.env should be added to .gitignore');
      } else {
        console.log('✅ .env properly ignored');
      }
    }

    // Check for hardcoded secrets in JS files
    const jsFiles = [
      'public/js/auth.js',
      'public/js/profile.js',
      'server.js'
    ];

    jsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const suspiciousPatterns = [
          /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
          /secret\s*[:=]\s*['"][^'"]{16,}['"]/i,
          /key\s*[:=]\s*['"][^'"]{16,}['"]/i,
          /mongodb:\/\/[^'"]*:[^'"]*@/i
        ];

        suspiciousPatterns.forEach((pattern, index) => {
          if (pattern.test(content)) {
            console.log(`⚠️ Potential hardcoded secret in ${file}`);
            this.warnings.push(`Review ${file} for hardcoded credentials`);
          }
        });
      }
    });
  }

  // Check route consistency
  checkRouteConsistency() {
    console.log('\n🛣️ ROUTE CONSISTENCY CHECK');
    console.log('-'.repeat(50));

    if (fs.existsSync('server.js')) {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      
      // Check if all route files are properly imported
      const routeFiles = ['auth.js', 'users.js', 'slots.js'];
      routeFiles.forEach(file => {
        const routePath = `routes/${file}`;
        if (fs.existsSync(routePath)) {
          const routeName = file.replace('.js', '');
          if (!serverContent.includes(`require('./routes/${file}')`)) {
            console.log(`⚠️ Route ${file} exists but not imported in server.js`);
            this.warnings.push(`Import ${routePath} in server.js`);
          }
        }
      });
    }
  }

  // Generate optimization report
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 WORKSPACE OPTIMIZATION REPORT');
    console.log('='.repeat(70));

    const successRate = Math.round((this.passedChecks / this.fileChecks) * 100);
    
    console.log(`\n📈 OVERALL STATUS:`);
    console.log(`Files Checked: ${this.fileChecks}`);
    console.log(`Passed: ${this.passedChecks}`);
    console.log(`Success Rate: ${successRate}%`);

    if (this.errors.length > 0) {
      console.log(`\n❌ CRITICAL ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    if (this.suggestions.length > 0) {
      console.log(`\n💡 SUGGESTIONS (${this.suggestions.length}):`);
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    }

    // Priority recommendations
    console.log('\n🎯 PRIORITY ACTIONS:');
    if (this.errors.length > 0) {
      console.log('1. ❌ Fix critical errors first');
    }
    if (successRate < 80) {
      console.log('2. 📁 Complete missing files and directories');
    }
    if (this.warnings.length > 5) {
      console.log('3. ⚠️ Address major warnings');
    }
    console.log('4. 🧪 Run asset tests: node scripts/start-asset-test.js');
    console.log('5. 🚀 Test application: npm start');

    console.log('\n🎰 Workspace optimization complete! ✨');
  }

  // Run all checks
  async runAllChecks() {
    this.checkDirectoryStructure();
    this.checkCoreFiles();
    this.checkAssets();
    this.checkJavaScriptFiles();
    this.checkCSSFiles();
    this.checkHTMLFiles();
    this.checkBackendFiles();
    this.checkDependencies();
    this.checkCommonIssues();
    this.checkRouteConsistency();
    this.generateReport();
  }
}

// Run the optimizer
const optimizer = new WorkspaceOptimizer();
optimizer.runAllChecks().catch(err => {
  console.error('Error running workspace optimization:', err);
  process.exit(1);
});