import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Database, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../Frontend/lib/api';


interface MigrationResult {
  success: boolean;
  message: string;
  usersFound?: number;
  usersUpdated?: number;
  errors?: number;
  errorDetails?: any[];
  verification?: {
    remainingSpecialization: number;
    totalWithDepartment: number;
  };
}

const DatabaseMigration = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isRunningSpec, setIsRunningSpec] = useState(false);
  const [resultSpec, setResultSpec] = useState<any | null>(null);
  const [errorSpec, setErrorSpec] = useState<string | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 Starting database migration...');
      
      const token = localStorage.getItem('gprs_access_token');
      const response = await fetch(
        `${API_BASE_URL}/api/migrate/rename-specialization-to-department`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Migration failed');
      }

      console.log('✅ Migration completed:', data.data);
      setResult(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Migration error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };
  
  const runSpecializationMigration = async () => {
    setIsRunningSpec(true);
    setErrorSpec(null);
    setResultSpec(null);

    try {
      console.log('🔄 Starting specialization → department migration...');
      
      const token = localStorage.getItem('gprs_access_token');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/migrate-specialization`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Migration failed');
      }

      console.log('✅ Specialization migration completed:', data);
      setResultSpec(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Specialization migration error:', errorMessage);
      setErrorSpec(errorMessage);
    } finally {
      setIsRunningSpec(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* SPECIALIZATION → DEPARTMENT Migration */}
        <Card className="shadow-lg border-2 border-amber-200">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-amber-600" />
              <div>
                <CardTitle className="text-2xl">⚡ Quick Fix: Specialization Migration</CardTitle>
                <CardDescription className="mt-1">
                  إصلاح سريع لمشكلة specialization → department
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Info Alert */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>المشكلة:</strong> قاعدة البيانات تحتوي على حقل "specialization" لكن الكود يستخدم "department"
                <br/>
                <strong>الحل:</strong> هذا الزر ينسخ قيمة specialization إلى department ويحذف الحقل القديم
              </AlertDescription>
            </Alert>

            {/* Run Migration Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={runSpecializationMigration}
                disabled={isRunningSpec}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8"
              >
                {isRunningSpec ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    إصلاح المشكلة الآن
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {errorSpec && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>خطأ:</strong> {errorSpec}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {resultSpec && (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    <strong>✅ تم الإصلاح بنجاح!</strong>
                    <br/>
                    {resultSpec.message}
                  </AlertDescription>
                </Alert>

                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm">
                      <strong>المستخدمين المحدّثين:</strong> {resultSpec.migratedCount || 0}
                    </div>
                    <div className="text-sm">
                      <strong>الحقول المحذوفة:</strong> {resultSpec.cleanedCount || 0}
                    </div>
                    <div className="text-xs text-slate-600 mt-3">
                      الآن يمكنك تسجيل الدخول مرة أخرى وتحديث ملفك الشخصي بدون مشاكل!
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Original Department Migration */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-600" />
              <div>
                <CardTitle className="text-2xl">Database Migration</CardTitle>
                <CardDescription className="mt-1">
                  Rename "specialization" field to "department" in users collection
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>إذا كنت تواجه مشكلة عند اختيار Department:</strong><br/>
                قم بتشغيل هذا الـ Migration مرة واحدة فقط لتحديث قاعدة البيانات من "specialization" إلى "department"
              </AlertDescription>
            </Alert>

            {/* Warning Alert */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Important:</strong> This migration will rename the field "specialization" to "department" 
                for all users in the MongoDB database. This operation is safe and reversible, but should only be 
                run once.
              </AlertDescription>
            </Alert>

            {/* Migration Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What this migration does:</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Finds all users with "specialization" field in MongoDB</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Renames the field to "department" using MongoDB $rename operator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Preserves all data - only the field name changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Verifies the migration was successful</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Reports detailed results and any errors</span>
                </li>
              </ul>
            </div>

            {/* Run Migration Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={runMigration}
                disabled={isRunning}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running Migration...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Run Migration
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Migration Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {result && (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    <strong>Migration Completed Successfully!</strong>
                  </AlertDescription>
                </Alert>

                {/* Results Details */}
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Migration Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="text-sm text-slate-600">Users Found</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {result.usersFound || 0}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="text-sm text-slate-600">Users Updated</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {result.usersUpdated || 0}
                        </div>
                      </div>
                    </div>

                    {result.errors !== undefined && result.errors > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-sm text-red-600 font-medium">
                          Errors: {result.errors}
                        </div>
                        {result.errorDetails && result.errorDetails.length > 0 && (
                          <div className="mt-2 text-xs text-red-700 space-y-1">
                            {result.errorDetails.map((err, idx) => (
                              <div key={idx}>
                                {err.email || err.userId}: {err.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {result.verification && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-900 mb-2">
                          Verification:
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <div>
                            Remaining with "specialization": {result.verification.remainingSpecialization}
                          </div>
                          <div>
                            Total with "department": {result.verification.totalWithDepartment}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-slate-600 italic">
                      {result.message}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow border">
          <h4 className="font-semibold text-slate-900 mb-2">After Migration:</h4>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>• All student profiles will use "department" instead of "specialization"</li>
            <li>• The frontend is already updated to use "department"</li>
            <li>• Supervisors continue to use their own specialization field</li>
            <li>• This migration only needs to be run once</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ✅ Default Export
export default DatabaseMigration;