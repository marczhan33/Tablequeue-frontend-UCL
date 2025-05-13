import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  restaurantId: number;
  restaurantName: string;
}

export const QRCodeGenerator = ({ restaurantId, restaurantName }: QRCodeGeneratorProps) => {
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Create URL for QR code that leads to customer waitlist form
    const baseUrl = window.location.origin;
    if (qrCodeValue) {
      setQrCodeUrl(`${baseUrl}/waitlist/${qrCodeValue}`);
    }
  }, [qrCodeValue]);
  
  const generateQrCode = async () => {
    try {
      setIsGenerating(true);
      // Call API to generate or retrieve QR code
      const response = await apiRequest({
        url: `/api/restaurants/${restaurantId}/qr-code`,
        method: 'POST'
      });
      
      const data = await response.json();
      setQrCodeValue(data.qrCodeId);
      toast({
        title: 'QR Code Generated',
        description: 'Your QR code has been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while generating the QR code.',
        variant: 'destructive',
      });
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const downloadQrCode = () => {
    const svg = document.getElementById('restaurant-qr-code');
    if (svg) {
      // Create a canvas element to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Create an image from the SVG
      const image = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      image.onload = () => {
        // Set canvas dimensions
        canvas.width = image.width * 3; // Scale up for better quality
        canvas.height = image.height * 3;
        
        // Draw white background and SVG on canvas
        if (context) {
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to PNG
          const pngUrl = canvas.toDataURL('image/png');
          
          // Create a download link
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-qrcode.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Clean up
          URL.revokeObjectURL(svgUrl);
        }
      };
      
      image.src = svgUrl;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">QR Code Generator</CardTitle>
        <CardDescription>
          Generate a QR code for customers to scan and join your waiting list
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        {qrCodeValue ? (
          <>
            <div className="p-4 bg-white rounded-lg shadow-md mb-4">
              <QRCode 
                id="restaurant-qr-code"
                value={qrCodeUrl} 
                size={200}
                level="H" 
                className="mx-auto" 
              />
            </div>
            <div className="text-center mb-4">
              <h3 className="font-medium mb-1">QR Code URL:</h3>
              <Badge variant="outline" className="font-mono text-sm p-2 break-all">
                {qrCodeUrl}
              </Badge>
            </div>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Print this QR code and place it on your restaurant window for walk-in customers.
            </p>
          </>
        ) : (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg w-full">
            <p className="mb-4 text-muted-foreground">
              Generate a unique QR code that customers can scan to join your wait list
            </p>
            <Button 
              onClick={generateQrCode} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </div>
        )}
      </CardContent>
      {qrCodeValue && (
        <CardFooter className="flex justify-center">
          <Button 
            onClick={downloadQrCode}
            variant="outline"
            className="w-full"
          >
            Download QR Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QRCodeGenerator;