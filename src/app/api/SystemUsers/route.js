import systemUsers from '../../Models/systemUsers';
import { NextResponse } from 'next/server';
import connectToMongo from "../../lib/mongodb_connection";

// POST API to Create a System User
export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectToMongo();
    
    const body = await request.json();
    console.log("Received system user creation request with body:", body);
    console.log("Customer ID from request:", body.customer_id);

    // Validate the request body
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    if (!body.password) {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    if (!body.userRole) {
      return NextResponse.json(
        { success: false, message: "User role is required" },
        { status: 400 }
      );
    }

    // Validate userRole enum
    if (!['Admin', 'Customer'].includes(body.userRole)) {
      return NextResponse.json(
        { success: false, message: "User role must be either 'Admin' or 'Customer'" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (body.password.length > 10) {
      return NextResponse.json(
        { success: false, message: "Password must not exceed 10 characters" },
        { status: 400 }
      );
    }

    // Check if the system user already exists by email
    const existingUser = await systemUsers.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "System user with this email already exists" },
        { status: 409 }
      );
    }

    // Create new system user
    const systemUser = new systemUsers({
      email: body.email,
      password: body.password,
      userRole: body.userRole,
      customer_id: body.customer_id || null,  // Add customer_id if provided
      created_at: new Date()
    });

    console.log("System user object before save:", systemUser);
    console.log("Customer ID in system user:", systemUser.customer_id);

    // Save system user to the database
    await systemUser.save();
    
    console.log("System user object after save:", systemUser);
    
    // Verify the saved document by fetching it from database
    const savedUser = await systemUsers.findById(systemUser._id);
    console.log("Fetched saved user from database:", savedUser);

    return NextResponse.json(
      { 
        success: true, 
        message: "System user created successfully", 
        userRole: systemUser.userRole,
        customer_id: systemUser.customer_id,
        user_id: systemUser._id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "System user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API to Retrieve System Users
export async function GET(request) {
  try {
    await connectToMongo();

    // Get query parameters for filtering
    const url = new URL(request.url);
    const userRole = url.searchParams.get('userRole');
    const email = url.searchParams.get('email');

    // Build filter object
    let filter = {};
    if (userRole) {
      filter.userRole = userRole;
    }
    if (email) {
      filter.email = email.toLowerCase();
    }

    // Retrieve system users based on filter
    const users = await systemUsers.find(filter).select('-password'); // Exclude password from response
    console.log("📌 System Users Data:", users);

    return NextResponse.json(
      { 
        success: true, 
        message: "System users retrieved successfully",
        users: users,
        count: users.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error retrieving system users:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE API to Remove a System User
export async function DELETE(request) {
  try {
    // Extract the user ID from the URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('_id');
    const email = url.searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: "User ID or email is required" },
        { status: 400 }
      );
    }

    await connectToMongo();

    let deletedUser;
    
    // Delete by ID or email
    if (userId) {
      deletedUser = await systemUsers.findByIdAndDelete(userId);
    } else {
      deletedUser = await systemUsers.findOneAndDelete({ email: email.toLowerCase() });
    }

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "System user not found" },
        { status: 404 }
      );
    }

    console.log(`System user ${deletedUser.email} deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "System user deleted successfully",
        userId: deletedUser._id,
        email: deletedUser.email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.error("Error deleting system user:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT API to Update a System User
export async function PUT(request) {
  try {
    await connectToMongo();

    const body = await request.json();
    console.log("Received system user update request with body:", body);

    const { _id, email, password, userRole, customer_id } = body;

    // Validate required fields
    if (!_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData = {};
    
    if (email) {
      updateData.email = email.toLowerCase();
    }
    
    if (password) {
      // Validate password length
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      if (password.length > 10) {
        return NextResponse.json(
          { success: false, message: "Password must not exceed 10 characters" },
          { status: 400 }
        );
      }
      updateData.password = password;
    }
    
    if (userRole) {
      // Validate userRole enum
      if (!['Admin', 'Customer'].includes(userRole)) {
        return NextResponse.json(
          { success: false, message: "User role must be either 'Admin' or 'Customer'" },
          { status: 400 }
        );
      }
      updateData.userRole = userRole;
    }

    if (customer_id !== undefined) {
      updateData.customer_id = customer_id;
    }

    // Check for existing user with same email (excluding current user)
    if (email) {
      const existingUser = await systemUsers.findOne({
        email: email.toLowerCase(),
        _id: { $ne: _id }
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Another system user with this email already exists" },
          { status: 409 }
        );
      }
    }

    console.log("Updating system user with ID:", _id);
    console.log("Update data:", updateData);

    // Update the system user
    const updatedUser = await systemUsers.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'System user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'System user updated successfully', 
        user: updatedUser 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Detailed Error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "System user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}