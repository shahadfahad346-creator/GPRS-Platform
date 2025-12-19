import random
import re
import string
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import ast
import bcrypt
from werkzeug.security import generate_password_hash, check_password_hash 



from werkzeug.security import generate_password_hash 
app = Flask(__name__)


from flask_cors import CORS

app = Flask(__name__)

# ✅ إضافة Frontend URL
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "https://gprs-frontend.onrender.com"  # ← أضف هذا
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

load_dotenv()


MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError("âŒ MONGODB_URI not found in environment variables")

try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client['GPRS']
    print("âœ… Connected to MongoDB successfully")
except Exception as e:
    print(f"âŒ MongoDB connection error: {e}")
    raise



def ensure_array(value):
    """Convert any value to array"""
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        if not value or not value.strip():
            return []
        if value.startswith('[') and value.endswith(']'):
            try:
                import json
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else []
            except:
                pass
        return [s.strip() for s in value.split(',') if s.strip()]
    return []

def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result[key] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) for item in value if item is not None]
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif value is None:
                result[key] = None
           
                continue  
            else:
                result[key] = value
        return result
    return doc
def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp):
    """
    Mock function to send OTP email
    In production: replace with real SMTP
    """
    print(f"\n{'='*50}")
    print(f"📧 [MOCK EMAIL] Sending OTP to: {email}")
    print(f"🔐 OTP Code: {otp}")
    print(f"⏰ Valid for: 5 minutes")
    print(f"{'='*50}\n")
    return True

def is_otp_expired(created_at, expiry_minutes=10):
    """Check if OTP is expired"""
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    expiry_time = created_at + timedelta(minutes=expiry_minutes)
    return datetime.utcnow() > expiry_time

import requests

@app.route('/analysis/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_to_fastapi(path):
    """توجيه طلبات التحليل إلى FastAPI"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response
    
    # Forward request to FastAPI
    fastapi_url = f'http://localhost:8001/analysis/{path}'
    
    try:
        resp = requests.request(
            method=request.method,
            url=fastapi_url,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False
        )
        
        response = jsonify(resp.json() if resp.content else {})
        response.status_code = resp.status_code
        
        # Add CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "Flask API"}), 200

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    # 1. التعامل مع طلب CORS المبدئي (Preflight)
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 204
    
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        print(f"🔍 [Login] Attempt: {email}")
        
        if not email or not password:
            return jsonify({
                "success": False,
                "error": "Email and password are required"
            }), 400
        
        # 1. البحث عن المستخدم في MongoDB
        user = db.users.find_one({"email": email})
        
        if not user:
            print(f"❌ [Login] User not found: {email}")
            # استخدم رسالة خطأ عامة لأغراض أمنية
            return jsonify({
                "success": False,
                "error": "Incorrect email or password"
            }), 401
        
        # 2. التحقق من كلمة المرور باستخدام التجزئة (Hashing)
        # نقارن كلمة المرور المدخلة (password) بالتجزئة المخزنة في قاعدة البيانات (user['password'])
        if not check_password_hash(user['password'], password):
            print(f"❌ [Login] Incorrect password attempt for: {email}")
            # استخدم رسالة خطأ عامة لأغراض أمنية
            return jsonify({
                "success": False,
                "error": "Incorrect email or password"
            }), 401
        
        # 3. تسجيل دخول ناجح
        
        # إزالة تجزئة كلمة المرور من الرد قبل إرسال بيانات المستخدم
        user_response = serialize_doc(user)
        user_response.pop('password', None)
        
        print(f"✅ [Login] Success for user: {email}")
        
        # يجب في تطبيق حقيقي توليد رمز JWT آمن هنا. نستخدم رمز وهمي مؤقت
        token = "dummy-token-" + str(user['_id'])
        
        return jsonify({
            "success": True,
            "token": token,
            "user": user_response
        }), 200 # رمز الحالة 200 للنجاح
        
    except Exception as e:
        print(f"❌ [Login] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "An internal server error occurred"
        }), 500
      
        
    except Exception as e:
        print(f"âŒ [Login] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    
@app.route('/api/auth/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        email = data.get('email')
        password_raw = data.get('password')
        name = data.get('name')
        role = data.get('role')

        if not all([email, password_raw, name, role]):
            return jsonify({"success": False, "error": "جميع الحقول مطلوبة"}), 400

        if role not in ['student', 'supervisor']:
            return jsonify({"success": False, "error": "الدور غير صحيح"}), 400

        # تحقق من وجود الحساب في users
        if db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}):
            return jsonify({"success": False, "error": "الإيميل مستخدم من قبل"}), 409

        hashed_password = generate_password_hash(password_raw)

        new_user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "role": role,
            "hasProfile": False,
            "createdAt": datetime.utcnow().isoformat()
        }

        if role == 'student':
            new_user.update({
                "groupMembers": [],
                "teamInvitations": [],
                "savedIdeas": [],
                "skills": [],
                "frameworks": [],
                "groupName": None
            })

        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)

        # لو مشرف → نحدث السجل القديم في Supervisor أو ننشئ واحد جديد
        if role == 'supervisor':
            # نبحث عن السجل القديم بالإيميل (مهما كانت حالة الأحرف)
            existing_sup = db.Supervisor.find_one({
                "Email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
            })

            if existing_sup:
                # لو موجود → نحدث فقط الحقول المهمة (ما نمسح شيء!)
                db.Supervisor.update_one(
                    {"_id": existing_sup["_id"]},
                    {
                        "$set": {
                            "Name": name,
                            "Email": email,
                            "userId": user_id,  # نضيف الربط بالحساب الجديد
                            "last_updated": datetime.utcnow().isoformat()
                        },
                        "$setOnInsert": {  # هذي الأهم: ما تشتغل إلا لو السجل جديد
                            "Department": "",
                            "Researcg_interest": [],
                            "Research": []
                        }
                    },
                    upsert=True
                )
                print(f"تم ربط الحساب الجديد مع السجل القديم لـ {email}")
            else:
                # لو ما لقيناه → ننشئ سجل جديد
                db.Supervisor.insert_one({
                    "Name": name,
                    "Email": email,
                    "Department": "",
                    "Researcg_interest": [],
                    "Research": [],
                    "userId": user_id,
                    "last_updated": datetime.utcnow().isoformat()
                })
                print(f"تم إنشاء سجل جديد في Supervisor لـ {email}")

        user_response = serialize_doc(new_user)
        user_response.pop('password', None)

        return jsonify({
            "success": True,
            "token": "dummy-token-" + user_id,
            "user": user_response
        }), 201

    except Exception as e:
        print(f"[Signup] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": "خطأ في السيرفر"}), 500

@app.route('/api/auth/forgot-password', methods=['POST', 'OPTIONS'])
def forgot_password():
    """Send OTP to user's email for password reset"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 204
    
    try:
        data = request.get_json()
        email = data.get('email')
        user_type = data.get('userType')
        
        print(f"🔐 [ForgotPassword] Request from: {email}, type: {user_type}")
        
        if not email or not user_type:
            return jsonify({
                "success": False,
                "error": "Email and userType are required"
            }), 400
        
        # Check if user exists
        user = db.users.find_one({"email": email, "role": user_type})
        
        if not user:
            print(f"❌ [ForgotPassword] User not found: {email}")
            # Security: Don't reveal if email exists
            return jsonify({
                "success": False,
                "error": "If this email exists, an OTP will be sent"
            }), 404
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP in database
        token_data = {
            "email": email,
            "otp": otp,
            "userType": user_type,
            "attempts": 0,
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(minutes=10)
        }
        
        # Delete any existing OTP for this email
        db.password_reset_tokens.delete_many({"email": email})
        
        # Insert new OTP
        db.password_reset_tokens.insert_one(token_data)
        
        # Send OTP email (Mock for now)
        send_otp_email(email, otp)
        
        print(f"✅ [ForgotPassword] OTP sent to: {email}")
        
        return jsonify({
            "success": True,
            "message": "OTP sent successfully"
        }), 200
        
    except Exception as e:
        print(f"❌ [ForgotPassword] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to send OTP"
        }), 500
    
    # ⭐⭐⭐ Verify OTP API  ⭐⭐⭐
@app.route('/api/auth/verify-otp', methods=['POST', 'OPTIONS'])
def verify_otp():
    """Verify OTP code"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 204
    
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        user_type = data.get('userType')
        
        print(f"🔍 [VerifyOTP] Request from: {email}, OTP: {otp}")
        
        if not email or not otp or not user_type:
            return jsonify({
                "success": False,
                "error": "Email, OTP, and userType are required"
            }), 400
        
        # Find OTP token in database
        token = db.password_reset_tokens.find_one({
            "email": email,
            "userType": user_type
        })
        
        if not token:
            print(f"❌ [VerifyOTP] No token found for: {email}")
            return jsonify({
                "success": False,
                "error": "Invalid or expired OTP"
            }), 404
        
        # Check if expired
        if is_otp_expired(token['createdAt']):
            print(f"⏰ [VerifyOTP] OTP expired for: {email}")
            db.password_reset_tokens.delete_one({"_id": token['_id']})
            return jsonify({
                "success": False,
                "error": "OTP has expired. Please request a new one"
            }), 400
        
        # Check attempts
        if token.get('attempts', 0) >= 3:
            print(f"🚫 [VerifyOTP] Max attempts reached for: {email}")
            db.password_reset_tokens.delete_one({"_id": token['_id']})
            return jsonify({
                "success": False,
                "error": "Maximum attempts exceeded. Please request a new OTP"
            }), 400
        
        # Verify OTP
        if token['otp'] != otp:
            print(f"❌ [VerifyOTP] Invalid OTP for: {email}")
            # Increment attempts
            db.password_reset_tokens.update_one(
                {"_id": token['_id']},
                {"$inc": {"attempts": 1}}
            )
            return jsonify({
                "success": False,
                "error": "Invalid OTP. Please try again"
            }), 400
        
        # OTP is valid - mark as verified
        db.password_reset_tokens.update_one(
            {"_id": token['_id']},
            {"$set": {"verified": True}}
        )
        
        print(f"✅ [VerifyOTP] OTP verified for: {email}")
        
        return jsonify({
            "success": True,
            "message": "OTP verified successfully"
        }), 200
        
    except Exception as e:
        print(f"❌ [VerifyOTP] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to verify OTP"
        }), 500
    
    # ⭐⭐⭐ Reset Password API - أضف هنا ⭐⭐⭐
@app.route('/api/auth/reset-password', methods=['POST', 'OPTIONS'])
def reset_password():
    """Reset user password after OTP verification"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 204
    
    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('newPassword')
        user_type = data.get('userType')
        
        print(f"🔐 [ResetPassword] Request from: {email}")
        
        if not email or not new_password or not user_type:
            return jsonify({
                "success": False,
                "error": "Email, newPassword, and userType are required"
            }), 400
        
        # Validate password strength
        if len(new_password) < 8:
            return jsonify({
                "success": False,
                "error": "Password must be at least 8 characters"
            }), 400
        
        # Check if OTP was verified
        token = db.password_reset_tokens.find_one({
            "email": email,
            "userType": user_type,
            "verified": True
        })
        
        if not token:
            print(f"❌ [ResetPassword] No verified token for: {email}")
            return jsonify({
                "success": False,
                "error": "Please verify OTP first"
            }), 400
        
        # Check if token expired
        if is_otp_expired(token['createdAt'], expiry_minutes=15):
            print(f"⏰ [ResetPassword] Token expired for: {email}")
            db.password_reset_tokens.delete_one({"_id": token['_id']})
            return jsonify({
                "success": False,
                "error": "Verification expired. Please start over"
            }), 400
        
        # Hash new password
        hashed_password = generate_password_hash(
            new_password, 
            method='pbkdf2:sha256', 
            salt_length=16
        )
        
        # Update user password
        result = db.users.update_one(
            {"email": email, "role": user_type},
            {"$set": {
                "password": hashed_password,
                "updatedAt": datetime.utcnow().isoformat()
            }}
        )
        
        if result.matched_count == 0:
            print(f"❌ [ResetPassword] User not found: {email}")
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Delete used token
        db.password_reset_tokens.delete_one({"_id": token['_id']})
        
        print(f"✅ [ResetPassword] Password reset successful for: {email}")
        
        return jsonify({
            "success": True,
            "message": "Password reset successfully"
        }), 200
        
    except Exception as e:
        print(f"❌ [ResetPassword] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to reset password"
        }), 500
  
@app.route('/api/auth/update-profile', methods=['POST', 'OPTIONS'])
def update_profile():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')
        email = data.get('email')

        if not user_id and not email:
            return jsonify({"success": False, "error": "userId or email required"}), 400

        query = {"_id": ObjectId(user_id)} if user_id else {"email": email}
        user = db.users.find_one(query)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        role = user.get("role")

        
        db.users.update_one(query, {"$set": {"hasProfile": True, "updatedAt": datetime.utcnow().isoformat()}})

        if role == "supervisor":
            
            new_sup_update = {
                "name": data.get("name", user["name"]),
                "email": user["email"],
                "department": data.get("department", ""),
                "researchInterests": ensure_array(data.get("researchInterests", [])),
                "researchPapers": data.get("researchPapers", [])
               
            }
            db.Supervisor.update_one(
                {"userId": str(user["_id"])},
                {"$set": new_sup_update},
                upsert=True
            )

            
            old_sup_update = {
                "Name": data.get("name", user["name"]),
                "Department": data.get("department", ""),
                "Researcg_interest": ensure_array(data.get("researchInterests", [])),  
                "Research": data.get("researchPapers", []),                           
            }
            db.Supervisor.update_one(
                {"Email": {"$regex": f"^{user['email']}$", "$options": "i"}},
                {"$set": old_sup_update},
                upsert=True
            )

        elif role == "student":
            student_update = {
                "name": data.get("name"),
                "specialization": data.get("specialization"),
                "skills": ensure_array(data.get("skills", [])),
                "frameworks": ensure_array(data.get("frameworks", [])),
                "groupName": data.get("groupName")
                
            }
            db.users.update_one(query, {"$set": student_update})

        
        updated_user = db.users.find_one(query)
        response = serialize_doc(updated_user)
        response.pop('password', None)

        if role == "supervisor":
            
            old_sup = db.Supervisor.find_one({"Email": {"$regex": f"^{user['email']}$", "$options": "i"}})
            if old_sup:
                response.update({
                    "department": old_sup.get("Department", ""),
                    "Researcg_interest": ensure_array(old_sup.get("Researcg_interest", [])),
                    "Research": ensure_array(old_sup.get("Research", [])),
                    "publications": len(ensure_array(old_sup.get("Research", []))),
                })

        return jsonify({"success": True, "user": response}), 200

    except Exception as e:
        print(f"[UpdateProfile] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/auth/get-user', methods=['POST'])
def get_user():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        if not user_id:
            return jsonify({"success": False, "error": "User ID is required"}), 400

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        user_data = serialize_doc(user)
        if user_data and 'savedIdeas' in user_data:
            for idea in user_data['savedIdeas']:
                if 'visible' not in idea:
                    idea['visible'] = True  

        return jsonify({"success": True, "user": user_data}), 200
    except Exception as e:
        print(f" [GetUser] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/legacy-supervisor', methods=['POST', 'OPTIONS'])
def get_legacy_supervisor_by_email():
    """جلب بيانات المشرف من المجموعة القديمة Supervisor بالإيميل فقط"""
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"success": False, "error": "email required"}), 400

        
        supervisor = db.Supervisor.find_one({
            "Email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
        })

        if not supervisor:
            return jsonify({"success": False, "error": "Not found in old system"}), 404

        return jsonify({
            "success": True,
            "supervisor": serialize_doc(supervisor)
        }), 200

    except Exception as e:
        print(f"[Legacy Supervisor] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '').strip()
        
        skip = (page - 1) * limit
        
        query = {}
        if search:
            query = {
                "$or": [
                    {"project_title": {"$regex": search, "$options": "i"}},
                    {"abstract": {"$regex": search, "$options": "i"}},
                    {"project_domain": {"$regex": search, "$options": "i"}},
                    {"department": {"$regex": search, "$options": "i"}},
                    {"supervisors": {"$regex": search, "$options": "i"}}
                ]
            }
        
        total = db['Graduation Projects BU'].count_documents(query)
        
        projects = list(
            db['Graduation Projects BU']
            .find(query)
            .skip(skip)
            .limit(limit)
        )
        
        return jsonify({
            "success": True,
            "data": [serialize_doc(p) for p in projects],
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        print(f" [GetProjects] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

def transform_supervisor_fast(sup):
    """Fast supervisor transformation with minimal processing"""
    research_value = sup.get("Research", [])
    
    
    if isinstance(research_value, str):
        try:
            research_list = ast.literal_eval(research_value) if research_value.startswith('[') else [research_value]
        except:
            research_list = [research_value] if research_value else []
    else:
        research_list = research_value if isinstance(research_value, list) else []
    
    return {
        "_id": str(sup.get("_id", "")),
        "name": sup.get("Name", "Unknown"),
        "email": sup.get("Email", ""),
        "specialization": sup.get("Department", ""),
        "researchPapers": [{"title": t} for t in research_list] if research_list else [],
        "authorId": sup.get("Author_ID", ""),
        "publications": len(research_list),
    }

@app.route("/api/supervisors", methods=["GET", "OPTIONS"])
def get_supervisors_optimized():
    if request.method == "OPTIONS":
        return "", 204

    try:
       
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))  
        search = request.args.get('search', '').strip()
        supervisor_id = request.args.get("id")
        
        
        if "Supervisor" not in db.list_collection_names():
            return jsonify({"success": True, "data": [], "pagination": {}}), 200

        
        query = {}
        if supervisor_id:
            try:
                query["_id"] = ObjectId(supervisor_id)
            except:
                return jsonify({"success": False, "error": "Invalid ID"}), 400
        elif search:
            
            query = {"$text": {"$search": search}}

        total = db["Supervisor"].count_documents(query) if not supervisor_id else 1
        
        skip = (page - 1) * limit
        
        projection = {
            "Name": 1,
            "Email": 1,
            "Department": 1,
            "Research": 1,
            "Author_ID": 1
        }
        
        supervisors_cursor = db["Supervisor"].find(
            query, 
            projection
        ).skip(skip).limit(limit)
        
        supervisor = list(supervisors_cursor)

        if not supervisor:
            return jsonify({
                "success": True,
                "data": [],
                "pagination": {
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "totalPages": 0
                }
            }), 200

        supervisors_data = [transform_supervisor_fast(sup) for sup in supervisor]
        
        total_pages = (total + limit - 1) // limit

        print(f" Returned {len(supervisors_data)} supervisor (page {page}/{total_pages})")
        
        return jsonify({
            "success": True,
            "data": supervisors_data,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": total_pages
            }
        }), 200

    except Exception as e:
        print(f" [GetSupervisors] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/supervisors/count", methods=["GET"])
def get_supervisors_count():
    try:
        if "Supervisor" not in db.list_collection_names():
            return jsonify({"success": True, "count": 0}), 200
        
        count = db["Supervisor"].count_documents({})
        return jsonify({"success": True, "count": count}), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/supervisors/<supervisor_id>", methods=["GET"])
def get_single_supervisor(supervisor_id):
    try:
        sup = db["Supervisor"].find_one({"_id": ObjectId(supervisor_id)})
        
        if not sup:
            return jsonify({"success": False, "error": "Supervisor not found"}), 404
        
        return jsonify({
            "success": True,
            "data": transform_supervisor_fast(sup)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
   

@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        students = list(db.users.find({"role": "student"}))
        print(f"Debug: Found {len(students)} students")
        students_data = []
        for student in students:
            print(f"Debug: Processing student {student.get('email')}")
            student_data = serialize_doc(student)
            student_data.pop('password', None)
            
            student_data['savedIdeas'] = [idea for idea in student_data.get('savedIdeas', []) if idea.get('visible', True)]
            students_data.append(student_data)
        print(f"Debug: Successfully serialized {len(students_data)} students")
        return jsonify({
            "success": True,
            "students": students_data
        }), 200
    except Exception as e:
        print(f"❌ [GetAllStudents] Error: {str(e)}")
        print(f"❌ [GetAllStudents] Stack trace: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/ideas', methods=['GET'])
def get_ideas():
    try:
        supervisor_id = request.args.get('supervisorId')
        query = {}
        if supervisor_id:
            query['supervisorId'] = supervisor_id
        ideas = list(db.ideas.find(query))
        return jsonify({
            "success": True,
            "data": [serialize_doc(idea) for idea in ideas]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ideas/add', methods=['POST', 'OPTIONS'])
def add_idea():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        supervisor_id = data.get('supervisorId')
        title = data.get('title')
        description = data.get('description')
        category = data.get('category')
        
        if not supervisor_id or not title or not description or not category:
            return jsonify({
                "success": False,
                "error": "supervisorId, title, description, and category are required"
            }), 400
        
        new_idea = {
            "supervisorId": supervisor_id,
            "title": title,
            "description": description,
            "category": category,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        result = db.ideas.insert_one(new_idea)
        new_idea['_id'] = str(result.inserted_id)
        
        return jsonify({
            "success": True,
            "idea": serialize_doc(new_idea)
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ideas/update', methods=['POST', 'OPTIONS'])
def update_idea():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        idea_id = data.get('ideaId')
        update_data = {
            "title": data.get('title'),
            "description": data.get('description'),
            "category": data.get('category')
        }
        
        if not idea_id:
            return jsonify({
                "success": False,
                "error": "ideaId is required"
            }), 400
        
        result = db.ideas.update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": {k: v for k, v in update_data.items() if v is not None}}
        )
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "Idea not found"
            }), 404
        
        updated_idea = db.ideas.find_one({"_id": ObjectId(idea_id)})
        return jsonify({
            "success": True,
            "idea": serialize_doc(updated_idea)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ideas/delete', methods=['POST', 'OPTIONS'])
def delete_idea():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        idea_id = data.get('ideaId')
        
        if not idea_id:
            return jsonify({
                "success": False,
                "error": "ideaId is required"
            }), 400
        
        result = db.ideas.delete_one({"_id": ObjectId(idea_id)})
        
        if result.deleted_count == 0:
            return jsonify({
                "success": False,
                "error": "Idea not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Idea deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/team/invitations', methods=['GET', 'OPTIONS'])
def get_team_invitations():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "userId is required"
            }), 400
        
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        invitations = user.get('teamInvitations', [])
        
        print(f"âœ… [GetInvitations] Found {len(invitations)} invitations for user {user_id}")
        
        return jsonify({
            "success": True,
            "invitations": invitations
        }), 200
        
    except Exception as e:
        print(f"âŒ [GetInvitations] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/accept-invitation', methods=['POST', 'OPTIONS'])
def accept_invitation():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        invitation_id = data.get('invitationId')
        user_id = data.get('userId')
        
        if not invitation_id or not user_id:
            return jsonify({
                "success": False,
                "error": "invitationId and userId are required"
            }), 400
        
        
        result = db.users.update_one(
            {
                "_id": ObjectId(user_id),
                "teamInvitations.id": invitation_id
            },
            {
                "$set": {
                    "teamInvitations.$.status": "accepted"
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "Invitation not found"
            }), 404
        
        print(f"âœ… [AcceptInvitation] Invitation {invitation_id} accepted by user {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Invitation accepted successfully"
        }), 200
        
    except Exception as e:
        print(f"âŒ [AcceptInvitation] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/reject-invitation', methods=['POST', 'OPTIONS'])
def reject_invitation():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        invitation_id = data.get('invitationId')
        user_id = data.get('userId')
        
        if not invitation_id or not user_id:
            return jsonify({
                "success": False,
                "error": "invitationId and userId are required"
            }), 400
        
        
        result = db.users.update_one(
            {
                "_id": ObjectId(user_id),
                "teamInvitations.id": invitation_id
            },
            {
                "$set": {
                    "teamInvitations.$.status": "rejected"
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "Invitation not found"
            }), 404
        
        print(f"âœ… [RejectInvitation] Invitation {invitation_id} rejected by user {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Invitation rejected successfully"
        }), 200
        
    except Exception as e:
        print(f"âŒ [RejectInvitation] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/profile/get', methods=['POST', 'OPTIONS'])
def get_profile():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('userId')
        email = data.get('email')
        
        if not user_id and not email:
            return jsonify({
                "success": False,
                "error": "Either userId or email is required"
            }), 400
        
        
        query = {}
        if user_id:
            query['_id'] = ObjectId(user_id)
        if email:
            query['email'] = email
        
        
        user = db.users.find_one(query)
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        
        user['specialization'] = user.get('specialization')
        user['skills'] = ensure_array(user.get('skills', []))
        user['frameworks'] = ensure_array(user.get('frameworks', []))
        user['groupMembers'] = user.get('groupMembers', [])
        user['teamInvitations'] = user.get('teamInvitations', [])
        user['savedIdeas'] = user.get('savedIdeas', [])
        user['agreed_idea_id'] = user.get('agreed_idea_id')  
        
        
        group_members = user.get('groupMembers', [])
        if group_members and len(group_members) > 0:
            member_emails = [m.get('email') for m in group_members if m.get('email')]
            
            
            team_member_with_idea = db.users.find_one({
                "email": {"$in": member_emails},
                "agreed_idea_id": {"$exists": True, "$ne": None}
            })
            
            if team_member_with_idea:
                agreed_idea_id = team_member_with_idea.get('agreed_idea_id')
                print(f"✅ [GetProfile] Found agreed_idea_id from team: {agreed_idea_id}")
                
                
                user_has_idea = any(
                    str(idea.get('_id')) == agreed_idea_id or str(idea.get('id')) == agreed_idea_id 
                    for idea in user['savedIdeas']
                )
                
                if not user_has_idea:
                    
                    for team_member_email in member_emails:
                        team_member = db.users.find_one({"email": team_member_email})
                        if not team_member:
                            continue
                        
                        team_member_ideas = team_member.get('savedIdeas', [])
                        agreed_idea = next(
                            (idea for idea in team_member_ideas 
                             if str(idea.get('_id')) == agreed_idea_id or str(idea.get('id')) == agreed_idea_id),
                            None
                        )
                        
                        if agreed_idea:
                            print(f"✅ [GetProfile] Copying agreed idea to user: {email}")
                            
                            agreed_idea['is_agreed'] = True
                            user['savedIdeas'].append(agreed_idea)
                            
                            
                            db.users.update_one(
                                {"email": email},
                                {"$set": {
                                    "savedIdeas": user['savedIdeas'],
                                    "agreed_idea_id": agreed_idea_id,
                                    "updatedAt": datetime.utcnow().isoformat()
                                }}
                            )
                            break
                
                
                user['agreed_idea_id'] = agreed_idea_id
                 
        
        agreed_idea_id = user.get('agreed_idea_id')
        if agreed_idea_id:
            for idea in user['savedIdeas']:
                idea_id = str(idea.get('_id') or idea.get('id'))
                idea['is_agreed'] = (idea_id == agreed_idea_id)
        
        
        user_response = serialize_doc(user)
        user_response.pop('password', None)
        
        print(f"✅ [GetProfile] Profile loaded for: {email or user_id}")
        print(f"📊 [GetProfile] savedIdeas count: {len(user['savedIdeas'])}, agreed_idea_id: {agreed_idea_id}")
        
        return jsonify({
            "success": True,
            "user": user_response
        }), 200
        
    except Exception as e:
        print(f"❌ [GetProfile] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/profile/update', methods=['POST', 'OPTIONS'])
def update_profile_data():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('userId')
        email = data.get('email')
        
        if not user_id and not email:
            return jsonify({
                "success": False,
                "error": "Either userId or email is required"
            }), 400
        
        
        query = {}
        if user_id:
            query['_id'] = ObjectId(user_id)
        if email:
            query['email'] = email
        
        
        update_data = {
            "name": data.get('name'),
            "specialization": data.get('specialization'),
            "skills": ensure_array(data.get('skills', [])),
            "frameworks": ensure_array(data.get('frameworks', [])),
            "groupName": data.get('groupName'),
            "groupMembers": data.get('groupMembers', []),
            "teamInvitations": data.get('teamInvitations', []),
            "savedIdeas": data.get('savedIdeas', []),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        
        if not update_data:
            return jsonify({
                "success": False,
                "error": "No data provided to update"
            }), 400
        
        
        result = db.users.update_one(query, {"$set": update_data})
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        if result.modified_count == 0:
            print(f"[UpdateProfile] No changes detected for user: {user_id or email}")
            
            updated_user = db.users.find_one(query)
        else:
            print(f"[UpdateProfile] Profile updated successfully for: {user_id or email}")
            updated_user = db.users.find_one(query)
        
        user_response = serialize_doc(updated_user)
        user_response.pop('password', None)
        
        return jsonify({
            "success": True,
            "user": user_response
        }), 200
        
    except Exception as e:
        print(f"[UpdateProfile] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Server error"
        }), 500
@app.route('/api/team/sync', methods=['POST', 'OPTIONS'])
def sync_team():
    """Sync team data across all team members"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_email = data.get('userEmail')
        group_name = data.get('groupName')
        group_members = data.get('groupMembers', [])
        
        if not user_email or not group_members:
            return jsonify({
                "success": False,
                "error": "userEmail and groupMembers are required"
            }), 400
        
        print(f"ðŸ”„ [TeamSync] Syncing team for {user_email}")
        print(f"ðŸ“‹ [TeamSync] Team members: {[m['email'] for m in group_members]}")
        
        
        conflicting_members = []
        for member in group_members:
            member_email = member.get('email')
            if not member_email:
                continue
            
            
            existing_user = db.users.find_one({"email": member_email})
            if not existing_user:
                continue
            
            
            existing_members = existing_user.get('groupMembers', [])
            if existing_members:
                
                existing_emails = set(m.get('email', '').lower().strip() for m in existing_members)
                
                new_emails = set(m.get('email', '').lower().strip() for m in group_members)
                
                
                if not existing_emails.intersection(new_emails):
                    conflicting_members.append({
                        "email": member_email,
                        "name": existing_user.get('name'),
                        "currentTeam": existing_user.get('groupName', 'Unknown Team')
                    })
        
        
        if conflicting_members:
            print(f"âŒ [TeamSync] Conflicts detected: {conflicting_members}")
            return jsonify({
                "success": False,
                "error": "Some members are already in another team",
                "conflictingMembers": conflicting_members
            }), 409
        
        
        results = []
        for member in group_members:
            member_email = member.get('email')
            if not member_email:
                continue
            
            result = db.users.update_one(
                {"email": member_email},
                {
                    "$set": {
                        "groupName": group_name,
                        "groupMembers": group_members,
                        "updatedAt": datetime.utcnow().isoformat()
                    }
                }
            )
            
            results.append({
                "email": member_email,
                "updated": result.modified_count > 0
            })
        
        print(f"âœ… [TeamSync] Successfully synced {len(results)} members")
        
        return jsonify({
            "success": True,
            "message": "Team synced successfully",
            "results": results
        }), 200
        
    except Exception as e:
        print(f"âŒ [TeamSync] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/remove-member', methods=['POST', 'OPTIONS'])
def remove_team_member():
    """Remove a member from the team and sync across all members"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_email = data.get('userEmail')
        member_email_to_remove = data.get('memberEmailToRemove')
        group_members = data.get('groupMembers', [])
        group_name = data.get('groupName')
        
        if not user_email or not member_email_to_remove:
            return jsonify({
                "success": False,
                "error": "userEmail and memberEmailToRemove are required"
            }), 400
        
        print(f"ðŸ—‘ï¸ [RemoveMember] Removing {member_email_to_remove} from team")
        
        
        updated_members = [m for m in group_members if m.get('email') != member_email_to_remove]
        
        
        db.users.update_one(
            {"email": member_email_to_remove},
            {
                "$set": {
                    "groupName": "",
                    "groupMembers": [],
                    "updatedAt": datetime.utcnow().isoformat()
                }
            }
        )
        
        
        results = []
        for member in updated_members:
            member_email = member.get('email')
            if not member_email:
                continue
            
            result = db.users.update_one(
                {"email": member_email},
                {
                    "$set": {
                        "groupName": group_name,
                        "groupMembers": updated_members,
                        "updatedAt": datetime.utcnow().isoformat()
                    }
                }
            )
            
            results.append({
                "email": member_email,
                "updated": result.modified_count > 0
            })
        
        print(f"âœ… [RemoveMember] Member removed and team synced")
        
        return jsonify({
            "success": True,
            "message": "Member removed successfully",
            "updatedMembers": updated_members,
            "results": results
        }), 200
        
    except Exception as e:
        print(f"âŒ [RemoveMember] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/update-leader', methods=['POST', 'OPTIONS'])
def update_team_leader():
    """Update team leader and sync across all members"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_email = data.get('userEmail')
        new_leader_id = data.get('newLeaderId')
        group_members = data.get('groupMembers', [])
        group_name = data.get('groupName')
        
        if not user_email or not new_leader_id:
            return jsonify({
                "success": False,
                "error": "userEmail and newLeaderId are required"
            }), 400
        
        print(f"ðŸ‘‘ [UpdateLeader] Setting new leader: {new_leader_id}")
        
        
        updated_members = []
        for member in group_members:
            member_copy = member.copy()
            member_copy['isLeader'] = (member.get('id') == new_leader_id)
            updated_members.append(member_copy)
        
        
        results = []
        for member in updated_members:
            member_email = member.get('email')
            if not member_email:
                continue
            
            result = db.users.update_one(
                {"email": member_email},
                {
                    "$set": {
                        "groupName": group_name,
                        "groupMembers": updated_members,
                        "updatedAt": datetime.utcnow().isoformat()
                    }
                }
            )
            
            results.append({
                "email": member_email,
                "updated": result.modified_count > 0
            })
        
        print(f"âœ… [UpdateLeader] Leader updated and team synced")
        
        return jsonify({
            "success": True,
            "message": "Leader updated successfully",
            "updatedMembers": updated_members,
            "results": results
        }), 200
        
    except Exception as e:
        print(f"âŒ [UpdateLeader] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/team/get-student', methods=['POST', 'OPTIONS'])
def get_student_by_email():
    """Get student data by email"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                "success": False,
                "error": "email is required"
            }), 400
        
        
        student = db.users.find_one({
            "email": email,
            "role": "student"
        })
        
        if not student:
            return jsonify({
                "success": False,
                "error": "Student not found"
            }), 404
        
        
        student_data = serialize_doc(student)
        student_data.pop('password', None)
        
        return jsonify({
            "success": True,
            "student": student_data
        }), 200
        
    except Exception as e:
        print(f"âŒ [GetStudent] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/team/get-all-students', methods=['GET', 'OPTIONS'])
def get_all_students():
    """Get all students"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        students = list(db.users.find({"role": "student"}))
        
        
        students_data = []
        for student in students:
            student_data = serialize_doc(student)
            student_data.pop('password', None)
            students_data.append(student_data)
        
        return jsonify({
            "success": True,
            "students": students_data
        }), 200
        
    except Exception as e:
        print(f"âŒ [GetAllStudents] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

from bson import ObjectId

@app.route("/api/profile/get/<user_id>", methods=["GET"])
def get_profile_by_id(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            user = db["Supervisor"].find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        user.pop("password", None)
        user["_id"] = str(user["_id"])
        return jsonify({"success": True, "user": serialize_doc(user)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/students/profile/ideas', methods=['POST', 'OPTIONS'])
def save_idea():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_id = data.get('userId')
        idea_data = data.get('idea')
        
        if not user_id or not idea_data:
            return jsonify({
                "success": False,
                "error": "userId and idea are required"
            }), 400
        
        print(f"💾 [SaveIdea] Saving idea for user: {user_id}")
        
        
        idea = {
            "id": str(ObjectId()),   
            "visible": True,
            "message": idea_data.get('message', ''),
            "title": idea_data.get('title', 'Untitled Project'),
            "description": idea_data.get('description', ''),
            "keywords": ensure_array(idea_data.get('keywords', [])),
            "status": idea_data.get('status', 'Analyzed'),
            "score": idea_data.get('score', 85),
            "date": idea_data.get('date', datetime.utcnow().isoformat()),
            "stage_1_initial_analysis": {
                "Project_Title": idea_data.get('stage_1_initial_analysis', {}).get('Project_Title', idea_data.get('title', 'Untitled Project')),
                "Executive_Summary": idea_data.get('stage_1_initial_analysis', {}).get('Executive_Summary', 'No summary provided'),
                "Domain": {
                    "General_Domain": idea_data.get('stage_1_initial_analysis', {}).get('Domain', {}).get('General_Domain', 'General'),
                    "Technical_Domain": idea_data.get('stage_1_initial_analysis', {}).get('Domain', {}).get('Technical_Domain', 'Technical'),
                },
                "Required_Skills": {
                    "Skills": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('Required_Skills', {}).get('Skills', [])),
                    "Matches": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('Required_Skills', {}).get('Matches', [])),
                    "Gaps": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('Required_Skills', {}).get('Gaps', [])),
                },
                "SWOT_Analysis": {
                    "Strengths": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('SWOT_Analysis', {}).get('Strengths', [])),
                    "Weaknesses": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('SWOT_Analysis', {}).get('Weaknesses', [])),
                    "Opportunities": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('SWOT_Analysis', {}).get('Opportunities', [])),
                    "Threats": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('SWOT_Analysis', {}).get('Threats', [])),
                },
                "Target_Audience": {
                    "Primary": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('Target_Audience', {}).get('Primary', [])),
                    "Secondary": ensure_array(idea_data.get('stage_1_initial_analysis', {}).get('Target_Audience', {}).get('Secondary', [])),
                },
            },
            "stage_2_extended_analysis": {
                "Supervisors": ensure_array(idea_data.get('stage_2_extended_analysis', {}).get('Supervisors', [])),
                "Similar_Projects": ensure_array(idea_data.get('stage_2_extended_analysis', {}).get('Similar_Projects', [])),
                "Improvements": ensure_array(idea_data.get('stage_2_extended_analysis', {}).get('Improvements', [])),
                "Final_Proposal": {
                    "Summary": idea_data.get('stage_2_extended_analysis', {}).get('Final_Proposal', {}).get('Summary', 'No proposal summary'),
                },
            },
            "similar_projects": ensure_array(idea_data.get('similar_projects', [])),
            "recommendedSupervisors": ensure_array(idea_data.get('recommendedSupervisors', [])),
        }
        
        
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"savedIdeas": idea}}
        )
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        print(f"✅ [SaveIdea] Idea saved successfully")
        
        return jsonify({
            "success": True,
            "idea": idea
        }), 200
        
    except Exception as e:
        print(f"❌ [SaveIdea] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500 


@app.route('/api/profile/view', methods=['POST'])
def view_profile():
    try:
        data = request.get_json()
        target_user_id = data.get('targetUserId')
        viewer_id = data.get('viewerId')

        if not target_user_id:
            return jsonify({"success": False, "error": "Target user ID is required"}), 400

        user = db.users.find_one({"_id": ObjectId(target_user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        user_data = serialize_doc(user)
        if target_user_id != viewer_id and 'savedIdeas' in user_data:
            user_data['savedIdeas'] = [idea for idea in user_data['savedIdeas'] if idea.get('visible', True)]

        return jsonify({"success": True, "user": user_data}), 200
    except Exception as e:
        print(f"❌ [ViewProfile] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/profile/update-idea-visibility', methods=['POST', 'OPTIONS'])
def update_idea_visibility():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')
        email = data.get('email')
        idea_id = data.get('ideaId')
        visible = data.get('visible')

        if not all([user_id, email, idea_id]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        result = db.users.update_one(
            {
                "_id": ObjectId(user_id),
                "email": email
            },
            {
                "$set": {
                    "savedIdeas.$[idea].visible": visible
                }
            },
            array_filters=[
                {
                    "$or": [
                        {"idea._id": idea_id},
                        {"idea.id": idea_id}
                    ]
                }
            ]
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "error": "User not found"}), 404

        if result.modified_count == 0:
            return jsonify({"success": False, "error": "Idea not found"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        print("❌ [UpdateIdeaVisibility]", e)
        return jsonify({"success": False, "error": "Server error"}), 500
@app.route('/api/students/profile/ideas/<idea_id>', methods=['DELETE', 'OPTIONS'])
def delete_student_saved_idea(idea_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json() or {}
        user_id = data.get('userId')

        if not user_id:
            return jsonify({"success": False, "error": "userId required"}), 400

        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$pull": {
                    "savedIdeas": {
                        "$or": [
                            {"_id": idea_id},
                            {"id": idea_id}
                        ]
                    }
                }
            }
        )

        if result.modified_count == 0:
            return jsonify({"success": False, "error": "Idea not found"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        print("❌ Delete Error:", e)
        return jsonify({"success": False, "error": "Server error"}), 500

@app.route('/api/profile/complete-setup', methods=['POST', 'OPTIONS'])
def complete_profile_setup():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')

        if not user_id:
            return jsonify({"success": False, "error": "userId is required"}), 400

        print(f"[CompleteSetup] Updating hasProfile for user: {user_id}")

        
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hasProfile": True, "updatedAt": datetime.utcnow().isoformat()}}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "error": "User not found"}), 404

        
        updated_user = db.users.find_one({"_id": ObjectId(user_id)})
        user_response = serialize_doc(updated_user)
        user_response.pop('password', None)

        print(f"[CompleteSetup] Success: hasProfile = true")
        return jsonify({
            "success": True,
            "user": user_response
        }), 200

    except Exception as e:
        print(f"[CompleteSetup] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500 
    
@app.route('/api/supervisor/by-email', methods=['POST'])
def get_supervisor_by_email():
    try:
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"success": False, "error": "email required"}), 400

        
        sup = db.Supervisor.find_one({
            "Email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
        })

        if not sup:
            return jsonify({"success": False, "error": "not found"}), 404

        return jsonify({
            "success": True,
            "supervisor": {
                "name": sup.get("Name"),
                "email": sup.get("Email"),
                "department": sup.get("Department"),
                "researchInterests": ensure_array(sup.get("Researcg_interest")),
                "researchPapers": ensure_array(sup.get("Research")),
                "publications": len(ensure_array(sup.get("Research")))
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500    
@app.route('/api/supervisor/profile', methods=['PUT', 'OPTIONS'])
def update_supervisor_profile():
    
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')

        if not user_id:
            return jsonify({"success": False, "error": "userId مطلوب"}), 400

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "supervisor":
            return jsonify({"success": False, "error": "مشرف غير موجود"}), 404

        update_data = {
            "Name": data.get("name", user["name"]),
            "Department": data.get("department", ""),
            "Researcg_interest": ensure_array(data.get("researchInterests", [])),
            "Research": data.get("researchPapers", [])
            
        }

        db.Supervisor.update_one(
            {"Email": user["email"]},
            {"$set": update_data},
            upsert=True
        )

        
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"hasProfile": True}})

        return jsonify({"success": True, "message": "تم تحديث البيانات بنجاح"}), 200

    except Exception as e:
        print(f"[UpdateProfile] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/supervisor/full-profile/<supervisor_id>', methods=['GET'])
def get_supervisor_full_profile(supervisor_id):
    try:
        print(f"\n🔍 Fetching supervisor profile for Supervisor ID: {supervisor_id}")

        # 1. جلب بيانات المشرف من collection Supervisor
        sup = db.Supervisor.find_one({"_id": ObjectId(supervisor_id)})
        
        if not sup:
            # fallback قديم
            user = db.users.find_one({"_id": ObjectId(supervisor_id), "role": "supervisor"})
            if not user:
                return jsonify({"success": False, "error": "Supervisor not found"}), 404
            
            sup = db.Supervisor.find_one({
                "Email": {"$regex": f"^{re.escape(user['email'])}$", "$options": "i"}
            })
            
            if not sup:
                profile = {
                    "_id": supervisor_id,
                    "name": user.get("name", "Unknown"),
                    "email": user.get("email", ""),
                    "department": "",
                    "researchInterests": [],
                    "researchPapers": [],
                    "publications": 0,
                    "ideas": []
                }
                return jsonify({"success": True, "supervisor": profile}), 200

        supervisor_email = sup.get("Email", "").strip()

        # 2. البحث عن الـ user المقابل في collection users بالإيميل للحصول على user._id
        auth_user = None
        if supervisor_email:
            auth_user = db.users.find_one({
                "email": {"$regex": f"^{re.escape(supervisor_email)}$", "$options": "i"},
                "role": "supervisor"
            })

        user_supervisor_id = str(auth_user["_id"]) if auth_user else supervisor_id  # fallback للـ ID الأصلي لو ما لقينا

        print(f"🔍 Supervisor Email: {supervisor_email}")
        print(f"🔍 Corresponding User ID (for ideas): {user_supervisor_id}")

        # 3. جلب الأفكار باستخدام user._id (اللي هو supervisorId المحفوظ في ideas)
        ideas = list(db.ideas.find({"supervisorId": user_supervisor_id}))
        print(f"✅ Found {len(ideas)} ideas using User ID: {user_supervisor_id}")

        # 4. معالجة الأبحاث
        research_papers = []
        raw_research = sup.get("Research", [])
        if isinstance(raw_research, list):
            for r in raw_research:
                if isinstance(r, str):
                    research_papers.append({"title": r, "platform": ""})
                elif isinstance(r, dict):
                    research_papers.append({
                        "title": r.get("title", "No Title"),
                        "platform": r.get("platform", "")
                    })
        elif isinstance(raw_research, str):
            for line in raw_research.split("\n"):
                if line.strip():
                    research_papers.append({"title": line.strip(), "platform": ""})

        # 5. بناء البروفايل النهائي
        profile = {
            "_id": supervisor_id,  # نرجع ID الـ Supervisor (للتوافق مع الفرونت)
            "name": sup.get("Name", "Unknown"),
            "email": supervisor_email,
            "department": sup.get("Department", ""),
            "researchInterests": ensure_array(sup.get("Researcg_interest", [])),
            "researchPapers": research_papers,
            "publications": len(research_papers),
            "ideas": [
                {
                    "id": str(idea["_id"]),
                    "title": idea.get("title", "No Title"),
                    "description": idea.get("description", ""),
                    "category": idea.get("category", "General")
                } for idea in ideas
            ]
        }

        print(f"✅ Returning full profile with {len(ideas)} ideas")
        return jsonify({"success": True, "supervisor": profile}), 200

    except Exception as e:
        print(f"❌ Error in full-profile: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/api/group/agree-idea', methods=['POST', 'OPTIONS'])
def agree_on_idea():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')
        idea_id = data.get('ideaId')

        if not user_id or not idea_id:
            return jsonify({"success": False, "error": "userId and ideaId are required"}), 400

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        group_members = user.get("groupMembers", [])
        if not group_members:
            return jsonify({"success": False, "error": "User is not in a group"}), 400

        
        idea = None
        for i in user.get("savedIdeas", []):
            if str(i.get("_id")) == idea_id or str(i.get("id")) == idea_id:
                idea = i
                break
        if not idea:
            return jsonify({"success": False, "error": "Idea not found"}), 404

        agreed_idea_id = str(idea.get("_id") or idea.get("id"))

        
        member_emails = [m.get("email") for m in group_members if m.get("email")]
        existing = db.users.find_one({
            "email": {"$in": member_emails},
            "agreed_idea_id": {"$exists": True, "$ne": None, "$ne": agreed_idea_id}
        })
        if existing:
            return jsonify({"success": False, "error": "Another idea is already agreed. Remove it first."}), 409

        
        updated_count = 0
        for email in member_emails:
            member_user = db.users.find_one({"email": email})
            if not member_user:
                continue

            updated_ideas = []
            for saved_idea in member_user.get("savedIdeas", []):
                sid = str(saved_idea.get("_id") or saved_idea.get("id"))
                is_agreed = (sid == agreed_idea_id)

                if is_agreed:
                    saved_idea["_previous_visible"] = saved_idea.get("visible", True)
                    saved_idea["visible"] = True  

                saved_idea["is_agreed"] = is_agreed
                updated_ideas.append(saved_idea)

            result = db.users.update_one(
                {"email": email},
                {"$set": {
                    "agreed_idea_id": agreed_idea_id,
                    "savedIdeas": updated_ideas,
                    "updatedAt": datetime.utcnow().isoformat()
                }}
            )
            if result.modified_count > 0:
                updated_count += 1

        return jsonify({
            "success": True,
            "message": "All members agreed!",
            "agreedIdeaId": agreed_idea_id,
            "updatedMembers": updated_count
        }), 200

    except Exception as e:
        print(f"[AgreeIdea] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/group/remove-agreement', methods=['POST', 'OPTIONS'])
def remove_agreement():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        user_id = data.get('userId')
        if not user_id:
            return jsonify({"success": False, "error": "userId required"}), 400

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("groupMembers"):
            return jsonify({"success": False, "error": "Not in a group"}), 400

        agreed_idea_id = user.get("agreed_idea_id")
        if not agreed_idea_id:
            return jsonify({"success": False, "error": "No agreement to remove"}), 400

        member_emails = [m.get("email") for m in user.get("groupMembers", []) if m.get("email")]
        updated_count = 0

        for email in member_emails:
            member_user = db.users.find_one({"email": email})
            if not member_user:
                continue

            updated_ideas = []
            for idea in member_user.get("savedIdeas", []):
                sid = str(idea.get("_id") or idea.get("id"))
                if sid == agreed_idea_id and "_previous_visible" in idea:
                    idea["visible"] = idea["_previous_visible"]
                idea["is_agreed"] = False
                idea.pop("_previous_visible", None)
                updated_ideas.append(idea)

            result = db.users.update_one(
                {"email": email},
                {"$set": {
                    "savedIdeas": updated_ideas,
                    "updatedAt": datetime.utcnow().isoformat()
                },
                "$unset": {"agreed_idea_id": ""}
                }
            )
            if result.modified_count > 0:
                updated_count += 1

        return jsonify({
            "success": True,
            "message": "Agreement removed",
            "updatedMembers": updated_count
        }), 200

    except Exception as e:
        print(f"[RemoveAgreement] Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500



if __name__ == '__main__':
    print("Flask server starting...")
    print("Available at: http://127.0.0.1:5000")
    print("MongoDB connected to database: GPRS")
    app.run(debug=True, host='0.0.0.0', port=5000)