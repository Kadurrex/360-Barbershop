# 360 מעלות - מספרה בכפר סבא

אתר נחיתה מודרני בעברית למספרת 360 מעלות בכפר סבא, כולל מערכת קביעת תורים.

## 🎯 אודות העסק

**שם:** 360 מעלות  
**כתובת:** ויצמן 1, כפר סבא  
**טלפון:** 09-7736351  
**דירוג:** ⭐ 5.0 מתוך 5 (מבוסס על 12 ביקורות)

## ✨ תכונות

- 🇮🇱 תמיכה מלאה בעברית עם פריסת RTL
- 💇 עיצוב מודרני ואלגנטי
- 📅 מערכת קביעת תורים
- 📱 רספונסיבי מלא (מובייל, טאבלט, דסקטופ)
- ✨ אנימציות חלקות ומעברים
- 🎨 ערכת צבעים מקצועית עם גוונים זהובים
- 🗺️ אינטגרציה עם Google Maps

## 🛠️ טכנולוגיות

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **עיצוב**: CSS מותאם אישית עם עקרונות עיצוב מודרניים
- **פונט**: Heebo (Google Fonts) - אופטימלי לעברית

## 💇 שירותים

1. **תספורת גברים** - החל מ-₪70
2. **תספורת נשים** - החל מ-₪100
3. **תספורת ילדים** - ₪50
4. **צביעת שיער** - החל מ-₪150
5. **החלקת שיער** - החל מ-₪400
6. **תסרוקות אירועים** - החל מ-₪300

## 📦 התקנה

1. שכפל או הורד את הפרויקט
2. התקן תלויות:
```bash
npm install
```

3. הפעל את השרת:
```bash
npm start
```

4. פתח את הדפדפן והיכנס ל-`http://localhost:3000`

## 🚀 פריסה

### פריסה ל-Render (מומלץ - יש תוכנית חינמית)

1. דחוף את הקוד ל-GitHub
2. גש ל-[Render](https://render.com)
3. הירשם או התחבר
4. לחץ על "New +" ובחר "Web Service"
5. חבר את ה-repository מ-GitHub
6. הגדר:
   - **Name**: 360-maalot-barbershop
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
7. לחץ על "Create Web Service"
8. האתר שלך יהיה זמין ב: `https://360-maalot-barbershop.onrender.com`

### פריסה ל-Railway

1. דחוף את הקוד ל-GitHub
2. גש ל-[Railway](https://railway.app)
3. הירשם עם GitHub
4. לחץ על "New Project" → "Deploy from GitHub repo"
5. בחר את ה-repository שלך
6. Railway יזהה אוטומטית שזה אפליקציית Node.js
7. האתר שלך יהיה זמין עם URL שנוצר אוטומטית

## 📡 API Endpoints

- `GET /` - דף הנחיתה הראשי
- `POST /api/appointments` - יצירת תור חדש
- `GET /api/appointments` - קבלת כל התורים
- `GET /api/appointments/:id` - קבלת תור לפי ID
- `DELETE /api/appointments/:id` - מחיקת תור
- `GET /health` - בדיקת תקינות השרת

## 📁 מבנה הקבצים

```
360-barbershop/
├── index.html          # קובץ HTML ראשי
├── styles.css          # עיצוב CSS
├── script.js           # JavaScript צד לקוח
├── server.js           # שרת Backend
├── package.json        # תלויות
├── appointments.json   # מסד נתונים של תורים (נוצר אוטומטית)
├── render.yaml         # הגדרות Render
├── railway.json        # הגדרות Railway
├── DEPLOYMENT_GUIDE.md # מדריך פריסה מפורט
└── README.md          # קובץ זה
```

## 🎨 התאמה אישית

### שינוי צבעים
ערוך את משתני ה-CSS ב-`styles.css`:
```css
:root {
    --primary-color: #d4af37;    /* זהב */
    --secondary-color: #1a1a1a;  /* כהה */
    --accent-color: #f0e68c;     /* זהב בהיר */
}
```

### שינוי פרטי העסק
ערוך את הפוטר ב-`index.html` לעדכון:
- מספר טלפון
- כתובת
- שעות פתיחה

### הוספת תמונות אמיתיות
החלף את ה-placeholders בגלריה עם תמונות אמיתיות:
```html
<div class="gallery-item">
    <img src="your-image.jpg" alt="תיאור">
</div>
```

## 🔧 שיקולים לייצור

לשימוש בייצור, שקול:
1. החלף אחסון קובץ JSON במסד נתונים אמיתי (PostgreSQL, MongoDB)
2. הוסף התראות אימייל לתורים
3. הוסף פאנל ניהול לניהול תורים
4. הטמע אימות לגישת מנהל
5. הוסף אינטגרציית תשלום במידת הצורך
6. הגדר תעודת SSL (רוב פלטפורמות האחסון כוללות זאת)
7. הוסף אנליטיקס (Google Analytics)
8. הטמע אופטימיזציות SEO

## 📞 יצירת קשר עם העסק

**360 מעלות - מספרה בכפר סבא**  
📍 ויצמן 1, כפר סבא  
📞 09-7736351  
🕒 א'-ה': 09:00-20:00 | ו': 09:00-16:00 | שבת: סגור

## 📄 רישיון

MIT License - ניתן להשתמש באתר זה לצרכי עסק.


