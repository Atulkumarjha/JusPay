// Debug withdrawal functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Withdrawal Debug Test ===');
    
    // Check if button exists
    const withdrawBtn = document.getElementById('withdraw-btn');
    console.log('Withdraw button found:', !!withdrawBtn);
    if (withdrawBtn) {
        console.log('Button element:', withdrawBtn);
        console.log('Button parent:', withdrawBtn.parentElement);
    }
    
    // Check if modal exists
    const modal = document.getElementById('withdrawalModal');
    console.log('Withdrawal modal found:', !!modal);
    if (modal) {
        console.log('Modal element:', modal);
    }
    
    // Check if Bootstrap is loaded
    console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
    
    // Check if app is initialized
    console.log('GloCoin app available:', typeof window.gloCoinApp !== 'undefined');
    
    // Add direct test button click
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            console.log('DIRECT BUTTON CLICK DETECTED!');
            
            if (modal) {
                console.log('Attempting to show modal directly...');
                if (typeof bootstrap !== 'undefined') {
                    try {
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                        console.log('Modal shown via Bootstrap');
                    } catch (error) {
                        console.error('Bootstrap modal error:', error);
                        // Fallback
                        modal.style.display = 'block';
                        modal.classList.add('show');
                        console.log('Modal shown via fallback');
                    }
                } else {
                    // Fallback without Bootstrap
                    modal.style.display = 'block';
                    modal.classList.add('show');
                    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    console.log('Modal shown without Bootstrap');
                }
            }
        });
        console.log('Direct event listener added to button');
    }
    
    setTimeout(() => {
        console.log('=== App State Check ===');
        if (window.gloCoinApp) {
            console.log('App current user:', window.gloCoinApp.currentUser);
            console.log('App auth token:', !!window.gloCoinApp.authToken);
        }
    }, 2000);
});
