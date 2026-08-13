import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, UserPlus, AlertCircle, Shield } from 'lucide-react';

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
    role: z.enum(['donor', 'recipient', 'admin']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'donor',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(data.email, data.password, data.role);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#12231F] flex items-center justify-center p-4 py-12 relative overflow-hidden warm-grid">
      {/* Decorative background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1F6F5C]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3C8B6E]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-[#DAD3C2] rounded-2xl p-8 shadow-xl shadow-[#12231F]/5 relative overflow-hidden z-10">
        {/* Decorative accent top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F6F5C] to-[#3C8B6E]"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#1F6F5C]/10 rounded-full border border-[#1F6F5C]/20">
                <Heart className="w-8 h-8 text-[#1F6F5C] heartbeat-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-serif-fraunces text-[#12231F]">
              Join LifeLink
            </h1>
            <p className="text-[#4A5C55] mt-2 text-xs">Create your account to save lives</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#12231F] mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5C55]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#DAD3C2] text-[#12231F] rounded-xl focus:border-[#1F6F5C] focus:ring-1 focus:ring-[#1F6F5C] outline-none transition-all placeholder-[#4A5C55]/40 text-xs"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12231F] mb-1.5 uppercase tracking-wider">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5C55]">
                  <Shield className="w-4 h-4" />
                </div>
                <select
                  {...register('role')}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-[#DAD3C2] text-[#12231F] rounded-xl focus:border-[#1F6F5C] focus:ring-1 focus:ring-[#1F6F5C] outline-none transition-all text-xs appearance-none cursor-pointer"
                >
                  <option value="donor">Donor (Organ Contributor)</option>
                  <option value="recipient">Recipient (Patient Candidate)</option>
                  <option value="admin">Admin Coordinator</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-[#4A5C55]">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              {errors.role && <p className="mt-1.5 text-xs text-red-600">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12231F] mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5C55]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#DAD3C2] text-[#12231F] rounded-xl focus:border-[#1F6F5C] focus:ring-1 focus:ring-[#1F6F5C] outline-none transition-all placeholder-[#4A5C55]/40 text-xs"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12231F] mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4A5C55]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#DAD3C2] text-[#12231F] rounded-xl focus:border-[#1F6F5C] focus:ring-1 focus:ring-[#1F6F5C] outline-none transition-all placeholder-[#4A5C55]/40 text-xs"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#1F6F5C] to-[#3C8B6E] hover:from-[#154C3F] hover:to-[#1F6F5C] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#1F6F5C]/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting || loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-[#4A5C55]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1F6F5C] hover:text-[#154C3F] font-bold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
