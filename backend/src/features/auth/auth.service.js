import jwt from "jsonwebtoken";
import User from "./user.model.js";
import config from "../../config/index.js";
import { AuthError, ConflictError, NotFoundError } from "../../utils/ApiError.js";

/**
 * Authentication and Session Management Service
 */
class AuthService {
  /**
   * Generates a signed Access Token (JWT)
   * 
   * @param {import('./user.model.js').User} user - User document
   * @returns {string} Signed JWT
   */
  generateAccessToken(user) {
    return jwt.sign(
      { 
        userId: user._id.toString(), 
        role: user.role,
        hospital: user.hospital,
        isSuperAdmin: user.isSuperAdmin
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  /**
   * Generates a signed Refresh Token (JWT)
   * 
   * @param {import('./user.model.js').User} user - User document
   * @returns {string} Signed JWT
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user._id.toString() },
      config.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
  }

  /**
   * Registers a new User
   * 
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {'donor'|'recipient'|'admin'} role - User role
   * @returns {Promise<import('./user.model.js').User>} Created user document
   * @throws {ConflictError} if email already exists
   */
  async register(email, password, role) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("Email address is already registered");
    }

    const newUser = new User({ email, password, role });
    await newUser.save();
    return newUser;
  }

  /**
   * Logins an existing user
   * 
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<{user: import('./user.model.js').User, accessToken: string, refreshToken: string}>}
   * @throws {AuthError} if invalid credentials
   */
  async login(email, password) {
    // Select password field explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AuthError("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthError("Invalid email or password");
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save refresh token in DB for rotation/revocation
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    // Exclude password from returned user object
    user.password = undefined;

    return { user, accessToken, refreshToken };
  }

  /**
   * Refreshes access token and rotates refresh token
   * 
   * @param {string} oldRefreshToken - The client's current refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   * @throws {AuthError} if token is invalid or reuse is detected
   */
  async refresh(oldRefreshToken) {
    try {
      const decoded = jwt.verify(oldRefreshToken, config.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId).select("+refreshToken");

      if (!user || user.refreshToken !== oldRefreshToken) {
        // Token reuse or mismatch detection
        if (user) {
          await User.updateOne({ _id: user._id }, { $unset: { refreshToken: "" } });
        }
        throw new AuthError("Session expired or invalid refresh token", true);
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await User.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AuthError("Invalid refresh token");
      }
      throw err;
    }
  }

  /**
   * Invalidates a user's active session
   * 
   * @param {string} userId - User ID to logout
   * @returns {Promise<void>}
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: "" } });
  }
}

export default new AuthService();
export { AuthService };
