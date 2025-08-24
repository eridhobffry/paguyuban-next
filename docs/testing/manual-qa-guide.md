# 🧪 Manual Testing Guide - Sprint 2 QA Coverage

## 📋 Overview

This guide contains manual test cases to expand QA coverage by 10%+ as part of Sprint 2. The development server should be running at `http://localhost:3001` (as shown in terminal output).

---

## **📋 Test 1: Site Header Navigation (Easy Start)**

### **Manual Steps:**

1. **Open browser** and go to `http://localhost:3001`
2. **Check header contains:**

   - ✅ Paguyuban logo (clickable)
   - ✅ Navigation menu items
   - ✅ Theme toggle button
   - ✅ User/login button

3. **Test navigation links:**
   - Click each navigation link
   - Verify pages load correctly
   - Check URL changes appropriately

### **Expected Results:**

- Header should be visible at top of page
- All navigation elements should be present
- Links should work without errors
- Mobile responsive behavior

---

## **📋 Test 2: Theme Toggle (Quick Win)**

### **Manual Steps:**

1. **Start in light mode** (default)
2. **Find theme toggle button** (usually moon/sun icon in header)
3. **Click to switch to dark mode:**
   - Background should become dark
   - Text colors should invert appropriately
4. **Click again to switch back to light mode**
5. **Test persistence:**
   - Refresh the page
   - Theme should remain as set

### **Expected Results:**

- Smooth theme transition
- All elements visible in both modes
- Theme preference saved between page loads

---

## **📋 Test 3: Logo Click Navigation**

### **Manual Steps:**

1. **Navigate to any page** (not homepage)
2. **Click the Paguyuban logo** in the header
3. **Verify navigation:**
   - Should go to homepage (`/`)
   - Should use smooth scrolling if already on homepage

### **Expected Results:**

- Logo is clickable
- Navigation works correctly
- No console errors

---

## **📋 Test 4: Mobile Responsiveness**

### **Manual Steps:**

1. **Resize browser to mobile width** (< 768px)
2. **Check mobile navigation:**

   - Hamburger menu should appear
   - Click to open navigation
   - All menu items should be accessible
   - Menu should close when clicking outside

3. **Test touch interactions:**
   - All buttons should be large enough for touch
   - No horizontal scrolling required

### **Expected Results:**

- Clean mobile layout
- Accessible mobile navigation
- Proper touch targets

---

## **📋 Test 5: Document Downloads**

### **Manual Steps:**

1. **Navigate to homepage** (`http://localhost:3001`)
2. **Find download buttons:**

   - Brochure
   - Financial Report
   - Sponsor Deck
   - Workshop Guide
   - Schedule PDF
   - Technical Specs

3. **Test each download:**
   - Click download button
   - Verify file downloads
   - Check file type and size

### **Expected Results:**

- All files download successfully
- Proper file types (PDFs)
- No 404 errors

---

## **📋 Test 6: Accessibility Basics**

### **Manual Steps:**

1. **Use Tab key navigation:**

   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Check logical tab order

2. **Test keyboard accessibility:**
   - All buttons should be keyboard accessible
   - Forms should be completable with keyboard only

### **Expected Results:**

- All interactive elements keyboard accessible
- Visible focus indicators
- Logical navigation flow

---

## **📋 Test 7: Chat Widget (if available)**

### **Manual Steps:**

1. **Find chat widget** (usually bottom right)
2. **Test basic functionality:**
   - Click to open chat
   - Send a test message
   - Verify response appears

### **Expected Results:**

- Chat widget opens/closes properly
- Messages can be sent
- Responses are received

---

## **📝 How to Report Results:**

For each test, mark with:

- ✅ **PASSED** - Everything worked as expected
- ❌ **FAILED** - What didn't work (with description)
- ⚠️ **PARTIAL** - Mostly worked but had issues
- ⏭️ **SKIPPED** - Not applicable or couldn't test

**Example:** "Test 1: Site Header ✅ PASSED - All elements present and navigation works"

---

## **🔧 Additional Testing Tools:**

### **Browser Dev Tools:**

- **Network tab**: Check for 404s, failed requests
- **Console tab**: Watch for JavaScript errors
- **Elements tab**: Inspect HTML structure
- **Mobile simulation**: Test responsive behavior

### **Accessibility Testing:**

- **Chrome DevTools**: Lighthouse audit
- **Wave extension**: Accessibility evaluation
- **Screen reader testing**: NVDA, VoiceOver

### **Performance Testing:**

- **Chrome DevTools**: Performance tab
- **Network throttling**: Slow 3G simulation
- **Memory usage**: Check for leaks

---

## **📊 Testing Checklist:**

- [ ] Site Header Navigation
- [ ] Theme Toggle
- [ ] Logo Navigation
- [ ] Mobile Responsiveness
- [ ] Document Downloads
- [ ] Accessibility Basics
- [ ] Chat Widget (if available)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance testing
- [ ] Error handling

---

## **🚨 Issues to Watch For:**

- **Broken links/404s**
- **JavaScript errors in console**
- **Mobile layout issues**
- **Slow loading times**
- **Accessibility violations**
- **Theme switching problems**
- **Form validation issues**

---

## **📞 Next Steps After Testing:**

1. **Document results** in this file
2. **Create GitHub issues** for any bugs found
3. **Report back** with test results
4. **Move to next sprint task** based on findings

---

**Ready to test?** Start with Test 1 and work through them systematically. The server is running at `http://localhost:3001`.
