package com.preplockmobile;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class BlockedAppActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create UI programmatically
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFF000000);
        layout.setPadding(50, 50, 50, 50);
        
        TextView title = new TextView(this);
        title.setText("🔒 App Blocked");
        title.setTextSize(32);
        title.setTextColor(0xFFFFFFFF);
        title.setGravity(android.view.Gravity.CENTER);
        
        TextView message = new TextView(this);
        message.setText("Complete your tasks to unlock this app!");
        message.setTextSize(18);
        message.setTextColor(0xFFAAAAAA);
        message.setGravity(android.view.Gravity.CENTER);
        message.setPadding(0, 20, 0, 40);
        
        Button backButton = new Button(this);
        backButton.setText("Go Back");
        backButton.setTextSize(16);
        backButton.setBackgroundColor(0xFF2563EB);
        backButton.setTextColor(0xFFFFFFFF);
        backButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        
        layout.addView(title);
        layout.addView(message);
        layout.addView(backButton);
        
        setContentView(layout);
    }
}
